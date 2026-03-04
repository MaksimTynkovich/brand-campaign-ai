<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartGenerationRequest;
use App\Jobs\ProcessGenerationJob;
use App\Models\GenerationJob;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GenerationController extends Controller
{
    /**
     * Список видео текущего пользователя (генерации: в процессе и готовые).
     */
    public function myVideos(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        $user = $request->user();
        if (!$userId) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $jobs = GenerationJob::where('user_id', $userId)
            ->with('template:id,category,description,preview_url,default_voiceover')
            ->orderByDesc('created_at')
            ->get();

        $data = $jobs->map(function (GenerationJob $job) use ($user) {
            $template = $job->template;
            $videoUrl = $this->resolveVideoUrlForUser($job, $user);
            return [
                'id' => $job->id,
                'status' => $job->status,
                'user_prompt' => $job->user_prompt,
                'video_url' => $videoUrl,
                'error_message' => $job->error_message,
                'created_at' => $job->created_at->toIso8601String(),
                'template' => $template ? [
                    'id' => $template->id,
                    'category' => $template->category,
                    'description' => $template->description,
                    'preview_url' => $template->preview_url,
                    'default_voiceover' => $template->default_voiceover,
                ] : null,
                'input_images' => collect($job->input['stored_paths'] ?? [])
                    ->filter(fn ($path) => is_string($path) && $path !== '')
                    ->values()
                    ->map(fn ($path) => URL::temporarySignedRoute(
                        'generation.serve-image',
                        now()->addDays(2),
                        ['path' => $path]
                    ))
                    ->all(),
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => ['total' => $data->count()],
        ]);
    }

    public function start(StartGenerationRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'error' => ['message' => 'Unauthorized', 'code' => 401, 'details' => []],
            ], 401);
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

        try {
            $template = Template::find($request->validated('template_id'));
            $userPrompt = (string) $request->input('prompt', '');
            $sourceJobId = $request->input('source_job_id');

            $user->spendCredits(1);

            $job = GenerationJob::create([
                'user_id' => $request->user()?->id,
                'template_id' => $template->id,
                'status' => GenerationJob::STATUS_PENDING,
                'user_prompt' => $userPrompt,
                'input' => null,
            ]);

            $copiedInput = null;
            if ($sourceJobId && !$request->hasFile('images')) {
                $sourceJob = GenerationJob::where('id', (int) $sourceJobId)
                    ->where('user_id', $request->user()?->id)
                    ->first();
                $storedPaths = $sourceJob?->input['stored_paths'] ?? [];
                if (is_array($storedPaths) && count($storedPaths) > 0) {
                    $copiedInput = ['stored_paths' => array_values($storedPaths)];
                }
            }

            if ($request->hasFile('images')) {
                $dir = 'generation-input/' . $job->id;
                $storedPaths = [];
                foreach ($request->file('images') as $file) {
                    $path = $file->store($dir, 'local');
                    $storedPaths[] = $path;
                }
                $job->update(['input' => ['stored_paths' => $storedPaths]]);
            } elseif ($copiedInput !== null) {
                $job->update(['input' => $copiedInput]);
            }

            ProcessGenerationJob::dispatch($job);
            Log::info('[Generation] Задача поставлена в очередь', ['job_id' => $job->id]);

            return response()->json(['data' => ['job_id' => $job->id]], 201);
        } catch (\Throwable $e) {
            Log::error('[Generation] start failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            $message = config('app.debug') ? $e->getMessage() : 'Ошибка при запуске генерации. Проверьте логи на сервере.';
            return response()->json([
                'message' => $message,
                'error' => ['message' => $message, 'code' => 500, 'details' => []],
            ], 500);
        }
    }

    public function status(Request $request, int $jobId): JsonResponse
    {
        $job = GenerationJob::where('id', $jobId)->where('user_id', $request->user()?->id)->first();
        if (!$job) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $videoUrl = $this->resolveVideoUrlForUser($job, $request->user());

        return response()->json([
            'data' => [
                'job_id' => $job->id,
                'status' => $job->status,
                'video_url' => $videoUrl,
                'error_message' => $job->error_message,
            ],
        ]);
    }

    /**
     * Скачать видео по job id (только своё, с Content-Disposition: attachment).
     */
    public function download(Request $request, int $jobId): BinaryFileResponse|JsonResponse
    {
        $job = GenerationJob::where('id', $jobId)
            ->where('user_id', $request->user()?->id)
            ->first();

        if (!$job || $job->status !== GenerationJob::STATUS_COMPLETED) {
            return response()->json([
                'error' => ['message' => 'Not Found', 'code' => 404, 'details' => []],
            ], 404);
        }

        $videoUrl = $this->resolveVideoUrlForUser($job, $request->user());
        if (!$videoUrl) {
            return response()->json([
                'error' => ['message' => 'Not Found', 'code' => 404, 'details' => []],
            ], 404);
        }

        $path = $this->videoPathToStorageRelative($videoUrl);
        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json([
                'error' => ['message' => 'File not found', 'code' => 404, 'details' => []],
            ], 404);
        }

        $fullPath = Storage::disk('public')->path($path);
        $filename = 'video_' . $job->id . '.mp4';

        return response()->file($fullPath, [
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Отдать файл из storage (local) по подписанной ссылке. Нужно для Kie.ai (ожидает публичные URL изображений).
     */
    public function serveImage(Request $request): StreamedResponse|JsonResponse
    {
        $path = (string) $request->query('path');
        if ($path === '' || str_contains($path, '..') || !str_starts_with($path, 'generation-input/')) {
            return response()->json(['error' => ['message' => 'Invalid path', 'code' => 400, 'details' => []]], 400);
        }

        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $mime = Storage::disk('local')->mimeType($path) ?: 'application/octet-stream';

        return response()->streamDownload(
            function () use ($path) {
                echo Storage::disk('local')->get($path);
            },
            basename($path),
            ['Content-Type' => $mime],
            'inline'
        );
    }

    /**
     * Выбрать, какую версию видео показывать пользователю в данный момент.
     * - Платный план → если есть original_video_path, показываем его.
     * - Бесплатный план → если есть watermarked_video_path, показываем его.
     * - Legacy / fallback → поле video_path.
     */
    private function resolveVideoUrlForUser(GenerationJob $job, ?\App\Models\User $user): ?string
    {
        if ($job->status !== GenerationJob::STATUS_COMPLETED) {
            return null;
        }

        $isPaid = $user ? $user->isPaidPlan() : false;

        if ($isPaid && $job->original_video_path) {
            return $job->original_video_path;
        }

        if (!$isPaid && $job->watermarked_video_path) {
            return $job->watermarked_video_path;
        }

        return $job->video_path;
    }

    private function videoPathToStorageRelative(?string $videoPath): ?string
    {
        if (!$videoPath || !is_string($videoPath)) {
            return null;
        }
        $path = parse_url($videoPath, PHP_URL_PATH);
        if (!$path || !str_starts_with($path, '/storage/')) {
            return null;
        }

        return ltrim(substr($path, strlen('/storage/')), '/');
    }
}
