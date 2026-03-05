<?php

namespace App\Services;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AdChatService
{
    private const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
    private const IMAGE_SELECTION_SYSTEM_PROMPT = <<<'TEXT'
You are selecting the best product reference images for ad video generation.
Return ONLY JSON in this format: {"selected":[1,2,3]}.

Selection rules:
- Choose images that best match the requested final video prompt.
- Prefer sharp, clear, well-lit photos where the product is visible.
- Avoid blurry, noisy, over-dark, overexposed, or irrelevant images.
- Prefer images where key product details and packaging are readable.
- Select up to 3 images.
TEXT;

    private const SYSTEM_PROMPT = <<<'TEXT'
Ты опытный креативный стратег по рекламным видео для e-commerce.
Ты общаешься с клиентом вежливо, понятно и максимально клиентоориентированно.

КРИТИЧЕСКОЕ ПРАВИЛО ПРО КОММУНИКАЦИЮ:
1) Клиент НЕ должен видеть технические детали пайплайна.
2) Никогда не упоминай модели, движки, API, внутренние промпты, системные маркеры, служебные блоки.
3) Нельзя писать фразы в стиле:
   - "Недостаточно данных для готового промпта"
   - "Дайте краткие ответы для сборки VEO3_PROMPT"
   - любые технические объяснения о генерации.
4) Вместо этого говори по-человечески, тепло и с фокусом на пользу для клиента.

ОБЩИЙ СТИЛЬ ОТВЕТА:
- дружелюбно, профессионально, без сухого тех. языка;
- коротко, структурно, по делу;
- на языке пользователя;
- если данных мало, задавай 3-6 естественных уточняющих вопросов в формате диалога с клиентом.

ТРЕБОВАНИЯ К КРЕАТИВУ (внутренние, не проговаривать клиенту как тех. требования):
- вертикальный формат 9:16;
- длительность всегда ровно 8 секунд;
- никогда не делай сценарий длиннее 8 секунд, даже если клиент просит 10/15/30 секунд;
- любые реплики/диалоги внутри финального video prompt всегда пиши на оригинальном языке пользователя;
- не переводи реплики на английский и не смешивай языки в репликах;
- никаких субтитров, титров или текстовых надписей на экране (no on-screen text, no captions, no subtitles);
- реалистичное видео в стиле съемки на iPhone;
- естественное движение камеры и света;
- физически правдоподобные действия с продуктом;
- без CGI/мультяшности;
- high detail.

КОГДА ДАННЫХ ДОСТАТОЧНО:
1) В видимом клиенту тексте:
   - дай финальный, уверенный ответ (угол, hooks, сценарий, caption/CTA);
   - вежливо предложи перейти к генерации видео (без тех. терминов).
2) В самом конце ответа добавь служебные блоки (для системы):
   [[READY_TO_GENERATE]]
   [[VIDEO_PROMPT]]
   <единый финальный video prompt на английском для генерации>
   [[/VIDEO_PROMPT]]

КОГДА ДАННЫХ НЕДОСТАТОЧНО:
- Не добавляй [[READY_TO_GENERATE]] и не добавляй [[VIDEO_PROMPT]].
- Просто продолжай диалог как клиентский консультант и мягко уточняй недостающую информацию.
TEXT;

    /**
     * @param  array<int, array{disk:string,path:string}>  $images
     * @return array{reply:string,source:string,error:?string}
     */
    public function buildReply(ChatSession $session, string $userMessage, array $images = []): array
    {
        $apiKey = config('services.openai.api_key');
        if (empty($apiKey)) {
            return [
                'reply' => "Я сохранил ваш запрос.\n\nЧтобы я начал полноценно генерировать рекламные идеи и сценарии, добавьте OPENAI_API_KEY в .env.",
                'source' => 'fallback_no_key',
                'error' => null,
            ];
        }

        $history = ChatMessage::query()
            ->where('chat_session_id', $session->id)
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->reverse()
            ->values();

        $messages = [
            ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
        ];

        foreach ($history as $message) {
            $messages[] = [
                'role' => $message->role === ChatMessage::ROLE_ASSISTANT ? 'assistant' : 'user',
                'content' => $message->content,
            ];
        }

        $content = [];
        $trimmedMessage = trim($userMessage);
        if ($trimmedMessage !== '') {
            $content[] = [
                'type' => 'text',
                'text' => $trimmedMessage,
            ];
        }

        foreach ($images as $image) {
            $disk = $image['disk'] ?? 'local';
            $path = $image['path'] ?? '';
            $dataUrl = $this->buildImageDataUrl((string) $disk, (string) $path);
            if ($dataUrl === null) {
                continue;
            }

            $content[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => $dataUrl,
                    'detail' => 'low',
                ],
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => count($content) > 0 ? $content : $trimmedMessage,
        ];

        try {
            $proxy = config('services.openai.proxy');
            $client = Http::withToken($apiKey)->timeout(90);
            if (!empty($proxy)) {
                $client = $client->withOptions(['proxy' => $proxy]);
            }

            /** @var Response $response */
            $response = $client->post(self::OPENAI_URL, [
                'model' => 'gpt-4.1',
                'messages' => $messages,
                'max_tokens' => 1500,
            ]);

            if (!$response->successful()) {
                $error = sprintf('HTTP %d: %s', $response->status(), $response->body());
                Log::warning('AdChatService OpenAI call failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'session_id' => $session->id,
                ]);

                return [
                    'reply' => 'Не удалось получить ответ ИИ. Попробуйте переформулировать запрос или отправить его повторно.',
                    'source' => 'openai_failed',
                    'error' => $error,
                ];
            }

            $data = $response->json();
            $reply = trim((string) ($data['choices'][0]['message']['content'] ?? ''));
            if ($reply === '') {
                return [
                    'reply' => 'Ответ от ИИ получился пустым. Попробуйте отправить сообщение еще раз.',
                    'source' => 'openai_empty',
                    'error' => 'OpenAI returned empty content',
                ];
            }

            return [
                'reply' => $reply,
                'source' => 'openai_success',
                'error' => null,
            ];
        } catch (\Throwable $e) {
            Log::warning('AdChatService exception', [
                'session_id' => $session->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'reply' => 'Возникла ошибка при обращении к ИИ. Попробуйте еще раз через несколько секунд.',
                'source' => 'openai_exception',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * @param  array<int, array{disk:string,path:string}>  $imageItems
     * @return array<int, array{disk:string,path:string}>
     */
    public function selectBestImagesForVideoPrompt(string $videoPrompt, array $imageItems, int $maxImages = 3): array
    {
        $cleanItems = collect($imageItems)
            ->filter(fn ($item) => is_array($item) && is_string($item['disk'] ?? null) && is_string($item['path'] ?? null))
            ->values()
            ->all();

        if (count($cleanItems) === 0) {
            return [];
        }

        $maxImages = max(1, min(3, $maxImages));
        $candidates = array_slice($cleanItems, 0, 12);

        $apiKey = config('services.openai.api_key');
        if (empty($apiKey)) {
            return array_slice($candidates, 0, $maxImages);
        }

        try {
            $userContent = [
                [
                    'type' => 'text',
                    'text' => "Final video prompt:\n" . trim($videoPrompt) . "\n\n"
                        . 'Choose the best matching and most usable product images from the list below.',
                ],
            ];

            foreach ($candidates as $index => $item) {
                $dataUrl = $this->buildImageDataUrl((string) $item['disk'], (string) $item['path']);
                if ($dataUrl === null) {
                    continue;
                }
                $number = $index + 1;
                $userContent[] = ['type' => 'text', 'text' => 'IMAGE_' . $number];
                $userContent[] = [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => $dataUrl,
                        'detail' => 'low',
                    ],
                ];
            }

            $response = $this->makeOpenAiRequest([
                ['role' => 'system', 'content' => self::IMAGE_SELECTION_SYSTEM_PROMPT],
                ['role' => 'user', 'content' => $userContent],
            ], 300);

            if (!$response->successful()) {
                Log::warning('AdChatService image selection failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return array_slice($candidates, 0, $maxImages);
            }

            $raw = trim((string) ($response->json()['choices'][0]['message']['content'] ?? ''));
            $selectedNumbers = $this->extractSelectedNumbers($raw, count($candidates), $maxImages);
            if (count($selectedNumbers) === 0) {
                return array_slice($candidates, 0, $maxImages);
            }

            $selected = [];
            foreach ($selectedNumbers as $number) {
                $idx = $number - 1;
                if (isset($candidates[$idx])) {
                    $selected[] = $candidates[$idx];
                }
            }

            return count($selected) > 0 ? $selected : array_slice($candidates, 0, $maxImages);
        } catch (\Throwable $e) {
            Log::warning('AdChatService image selection exception', ['error' => $e->getMessage()]);
            return array_slice($candidates, 0, $maxImages);
        }
    }

    /**
     * @return array<int, int>
     */
    private function extractSelectedNumbers(string $raw, int $totalCandidates, int $maxImages): array
    {
        $normalized = $raw;
        if (preg_match('/\{[\s\S]*\}/', $raw, $m)) {
            $normalized = (string) $m[0];
        }

        $selected = [];
        $decoded = json_decode($normalized, true);
        if (is_array($decoded) && is_array($decoded['selected'] ?? null)) {
            foreach ($decoded['selected'] as $n) {
                $num = (int) $n;
                if ($num >= 1 && $num <= $totalCandidates) {
                    $selected[] = $num;
                }
            }
        } elseif (preg_match_all('/\d+/', $raw, $nums)) {
            foreach ($nums[0] as $n) {
                $num = (int) $n;
                if ($num >= 1 && $num <= $totalCandidates) {
                    $selected[] = $num;
                }
            }
        }

        $unique = array_values(array_unique($selected));
        return array_slice($unique, 0, $maxImages);
    }

    private function buildImageDataUrl(string $disk, string $path): ?string
    {
        if ($path === '' || !Storage::disk($disk)->exists($path)) {
            return null;
        }

        $fullPath = Storage::disk($disk)->path($path);
        $mime = @mime_content_type($fullPath) ?: 'image/jpeg';
        $raw = Storage::disk($disk)->get($path);
        if ($raw === '' || $raw === false) {
            return null;
        }

        return 'data:' . $mime . ';base64,' . base64_encode($raw);
    }

    /**
     * @param  array<int, array<string, mixed>>  $messages
     */
    private function makeOpenAiRequest(array $messages, int $maxTokens): Response
    {
        $proxy = config('services.openai.proxy');
        $client = Http::withToken(config('services.openai.api_key'))->timeout(90);
        if (!empty($proxy)) {
            $client = $client->withOptions(['proxy' => $proxy]);
        }

        /** @var Response $response */
        $response = $client->post(self::OPENAI_URL, [
            'model' => 'gpt-4.1',
            'messages' => $messages,
            'max_tokens' => $maxTokens,
        ]);

        return $response;
    }
}
