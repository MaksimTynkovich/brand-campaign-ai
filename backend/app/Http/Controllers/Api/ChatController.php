<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartChatGenerationRequest;
use App\Http\Requests\StoreChatMessageRequest;
use App\Jobs\ProcessGenerationJob;
use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\GenerationJob;
use App\Services\AdChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if (!$userId) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $sessions = ChatSession::query()
            ->where('user_id', $userId)
            ->with(['messages' => fn ($q) => $q->latest('id')->limit(1)])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->get();

        $data = $sessions->map(fn (ChatSession $session) => $this->serializeSession($session));

        return response()->json([
            'data' => $data,
            'meta' => ['total' => $data->count()],
        ]);
    }

    public function show(Request $request, int $sessionId): JsonResponse
    {
        $session = ChatSession::query()
            ->where('id', $sessionId)
            ->where('user_id', $request->user()?->id)
            ->with(['messages' => fn ($q) => $q->latest('id')->limit(1)])
            ->first();

        if (!$session) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $messages = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->orderBy('id')
            ->get()
            ->map(fn (ChatMessage $message) => $this->serializeMessage($message))
            ->map(function (array $msg) use ($request) {
                $user = $request->user();
                $jobId = $msg['meta']['generation_job_id'] ?? null;
                if (! $jobId || ! $user) {
                    return $msg;
                }
                $job = GenerationJob::where('id', $jobId)->where('user_id', $user->id)->first();
                if (! $job || $job->status !== GenerationJob::STATUS_COMPLETED) {
                    return $msg;
                }
                $msg['generation_video_url'] = $this->resolveVideoUrlForJob($job, $user);

                return $msg;
            })
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'session' => $this->serializeSession($session),
                'messages' => $messages,
            ],
        ]);
    }

    public function storeMessage(StoreChatMessageRequest $request, AdChatService $chatService): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => ['message' => 'Unauthorized', 'code' => 401, 'details' => []]], 401);
        }

        $sessionId = $request->validated('session_id');
        $messageText = trim((string) $request->validated('message', ''));

        $session = null;
        if ($sessionId) {
            $session = ChatSession::query()
                ->where('id', (int) $sessionId)
                ->where('user_id', $user->id)
                ->first();
        }

        if (!$session) {
            $session = ChatSession::create([
                'user_id' => $user->id,
                'title' => $messageText !== '' ? mb_substr($messageText, 0, 120) : null,
            ]);
        }

        $storedImagePaths = [];
        if ($request->hasFile('images')) {
            $dir = 'chat-input/' . $session->id;
            foreach ($request->file('images') as $file) {
                $storedImagePaths[] = $file->store($dir, 'local');
            }
        }

        $attachmentPayload = collect($storedImagePaths)->map(function (string $path) {
            return [
                'disk' => 'local',
                'path' => $path,
                'url' => URL::temporarySignedRoute(
                    'chat.serve-image',
                    now()->addDays(2),
                    ['path' => $path]
                ),
            ];
        })->values()->all();

        $userMessage = null;
        $assistantMessage = null;
        $chatResult = null;

        DB::transaction(function () use (
            &$userMessage,
            &$assistantMessage,
            &$chatResult,
            $chatService,
            $session,
            $user,
            $messageText,
            $attachmentPayload,
            $storedImagePaths
        ) {
            $userMessage = ChatMessage::create([
                'chat_session_id' => $session->id,
                'user_id' => $user->id,
                'role' => ChatMessage::ROLE_USER,
                'content' => $messageText,
                'attachments' => $attachmentPayload,
            ]);

            $chatResult = $chatService->buildReply(
                $session,
                $messageText,
                collect($storedImagePaths)->map(fn (string $path) => ['disk' => 'local', 'path' => $path])->all()
            );

            $assistantMessage = ChatMessage::create([
                'chat_session_id' => $session->id,
                'user_id' => $user->id,
                'role' => ChatMessage::ROLE_ASSISTANT,
                'content' => $chatResult['reply'],
                'meta' => [
                    'source' => $chatResult['source'],
                    'error' => $chatResult['error'],
                ],
            ]);

            $session->update([
                'last_message_at' => now(),
                'title' => $session->title ?: ($messageText !== '' ? mb_substr($messageText, 0, 120) : null),
            ]);
        });

        if (!$userMessage || !$assistantMessage) {
            return response()->json([
                'error' => ['message' => 'Chat messages were not created', 'code' => 500, 'details' => []],
            ], 500);
        }

        return response()->json([
            'data' => [
                'session' => $this->serializeSession($session->fresh()),
                'user_message' => $this->serializeMessage($userMessage),
                'assistant_message' => $this->serializeMessage($assistantMessage),
            ],
        ], 201);
    }

    public function startGeneration(StartChatGenerationRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => ['message' => 'Unauthorized', 'code' => 401, 'details' => []]], 401);
        }
        if ($user->isBlocked()) {
            return response()->json([
                'error' => ['message' => 'Доступ к генерации видео заблокирован', 'code' => 403, 'details' => []],
            ], 403);
        }
        if (!$user->hasCredits(1)) {
            return response()->json([
                'error' => ['message' => 'Недостаточно кредитов', 'code' => 402, 'details' => []],
            ], 402);
        }

        $session = ChatSession::query()
            ->where('id', (int) $request->validated('session_id'))
            ->where('user_id', $user->id)
            ->first();

        if (!$session) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $messageId = $request->validated('message_id');
        $assistantMessageQuery = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->where('role', ChatMessage::ROLE_ASSISTANT);

        if ($messageId) {
            $assistantMessageQuery->where('id', (int) $messageId);
        } else {
            $assistantMessageQuery->latest('id');
        }

        $assistantMessage = $assistantMessageQuery->first();
        if (!$assistantMessage) {
            return response()->json([
                'error' => ['message' => 'Assistant message not found', 'code' => 422, 'details' => []],
            ], 422);
        }

        $prompt = $this->extractVeoPrompt((string) $assistantMessage->content);
        if ($prompt === '') {
            return response()->json([
                'error' => ['message' => 'Prompt is empty', 'code' => 422, 'details' => []],
            ], 422);
        }

        // Берём до 3 последних фото из сообщений пользователя (новые первыми, без AI-выборки)
        $historyUserMessages = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->where('role', ChatMessage::ROLE_USER)
            ->where('id', '<=', $assistantMessage->id)
            ->whereNotNull('attachments')
            ->orderByDesc('id')
            ->limit(50)
            ->get();

        $storedPaths = [];
        $maxImages = 3;
        foreach ($historyUserMessages as $userMessage) {
            $paths = $this->extractStoredLocalPaths($userMessage->attachments ?? []);
            foreach ($paths as $path) {
                if (count($storedPaths) >= $maxImages) {
                    break 2;
                }
                if (! in_array($path, $storedPaths, true)) {
                    $storedPaths[] = $path;
                }
            }
        }

        $user->spendCredits(1);

        $job = GenerationJob::create([
            'user_id' => $user->id,
            'template_id' => null,
            'status' => GenerationJob::STATUS_PENDING,
            'user_prompt' => $prompt,
            'input' => ['stored_paths' => $storedPaths],
        ]);

        ProcessGenerationJob::dispatch($job);

        $assistantMeta = $assistantMessage->meta ?? [];
        $assistantMeta['generation_job_id'] = $job->id;
        $assistantMeta['generation_started_at'] = now()->toIso8601String();
        $assistantMessage->update(['meta' => $assistantMeta]);

        return response()->json([
            'data' => [
                'job_id' => $job->id,
                'message_id' => $assistantMessage->id,
                'session_id' => $session->id,
            ],
        ], 201);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        if (!$request->user()?->is_admin) {
            return response()->json(['error' => ['message' => 'Forbidden', 'code' => 403, 'details' => []]], 403);
        }

        $sessions = ChatSession::query()
            ->with(['user:id,email', 'messages' => fn ($q) => $q->latest('id')->limit(1)])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        $data = $sessions->map(function (ChatSession $session) {
            $item = $this->serializeSession($session);
            $item['user'] = $session->user ? ['id' => $session->user->id, 'email' => $session->user->email] : null;
            return $item;
        });

        return response()->json([
            'data' => $data,
            'meta' => ['total' => $data->count()],
        ]);
    }

    public function adminShow(Request $request, int $sessionId): JsonResponse
    {
        if (!$request->user()?->is_admin) {
            return response()->json(['error' => ['message' => 'Forbidden', 'code' => 403, 'details' => []]], 403);
        }

        $session = ChatSession::query()
            ->with([
                'user:id,email',
                'messages' => fn ($q) => $q->latest('id')->limit(1),
            ])
            ->find($sessionId);
        if (!$session) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $messages = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->orderBy('id')
            ->get()
            ->map(fn (ChatMessage $message) => $this->serializeMessage($message));

        return response()->json([
            'data' => [
                'session' => array_merge($this->serializeSession($session), [
                    'user' => $session->user ? ['id' => $session->user->id, 'email' => $session->user->email] : null,
                ]),
                'messages' => $messages,
            ],
        ]);
    }

    public function serveImage(Request $request): StreamedResponse|JsonResponse
    {
        $path = (string) $request->query('path');
        if ($path === '' || str_contains($path, '..') || !str_starts_with($path, 'chat-input/')) {
            return response()->json(['error' => ['message' => 'Invalid path', 'code' => 400, 'details' => []]], 400);
        }

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $fullPath = Storage::disk('local')->path($path);
        $mime = @mime_content_type($fullPath) ?: 'application/octet-stream';

        return response()->streamDownload(
            function () use ($path) {
                echo Storage::disk('local')->get($path);
            },
            basename($path),
            ['Content-Type' => $mime],
            'inline'
        );
    }

    private function serializeSession(ChatSession $session): array
    {
        $latest = $session->messages->first();
        return [
            'id' => $session->id,
            'title' => $session->title,
            'last_message_at' => $session->last_message_at?->toIso8601String(),
            'created_at' => $session->created_at?->toIso8601String(),
            'latest_message' => $latest ? [
                'id' => $latest->id,
                'role' => $latest->role,
                'content' => $latest->content,
                'created_at' => $latest->created_at?->toIso8601String(),
            ] : null,
        ];
    }

    private function serializeMessage(ChatMessage $message): array
    {
        return [
            'id' => $message->id,
            'session_id' => $message->chat_session_id,
            'role' => $message->role,
            'content' => $message->content,
            'attachments' => $message->attachments ?? [],
            'meta' => $message->meta,
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }

    private function extractVeoPrompt(string $content): string
    {
        $text = trim($content);
        if ($text === '') {
            return '';
        }

        if (preg_match('/\[\[VIDEO_PROMPT\]\](.*?)\[\[\/VIDEO_PROMPT\]\]/is', $text, $match)) {
            return trim((string) ($match[1] ?? ''));
        }

        if (preg_match('/VEO3_PROMPT\s*:?\s*```(?:text)?\s*(.*?)```/is', $text, $match)) {
            return trim((string) ($match[1] ?? ''));
        }

        if (preg_match('/VEO3_PROMPT\s*:?\s*(.+)$/is', $text, $match)) {
            return trim((string) ($match[1] ?? ''));
        }

        return $text;
    }

    /**
     * @param  mixed  $attachments
     * @return array<int, string>
     */
    /**
     * @param  mixed  $attachments
     * @return array<int, string>
     */
    private function extractStoredLocalPaths(mixed $attachments): array
    {
        if (!is_array($attachments)) {
            return [];
        }

        return collect($attachments)
            ->filter(fn ($item) => is_array($item) && (($item['disk'] ?? 'local') === 'local') && is_string($item['path'] ?? null))
            ->map(fn ($item) => $item['path'])
            ->filter(fn ($path) => Storage::disk('local')->exists($path))
            ->values()
            ->all();
    }

    private function resolveVideoUrlForJob(GenerationJob $job, ?\App\Models\User $user): ?string
    {
        if ($job->status !== GenerationJob::STATUS_COMPLETED) {
            return null;
        }
        $isPaid = $user ? $user->isPaidPlan() : false;
        if ($isPaid && $job->original_video_path) {
            return $job->original_video_path;
        }
        if (! $isPaid && $job->watermarked_video_path) {
            return $job->watermarked_video_path;
        }

        return $job->video_path;
    }
}
