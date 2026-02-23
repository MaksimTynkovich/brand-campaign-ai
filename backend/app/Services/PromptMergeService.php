<?php

namespace App\Services;

use App\Models\OpenaiPromptLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Сливает исходный промпт шаблона с описанием пользователя.
 * Если задан OPENAI_API_KEY — запрос к ChatGPT, иначе простая конкатенация.
 * Каждый вызов логируется в openai_prompt_logs для статистики.
 */
class PromptMergeService
{
    private const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

    private const SYSTEM_PROMPT_VISION = <<<'TEXT'
You are a video prompt engineer for AI video generation (VEO). You receive:
1) A template prompt — defines the video style and structure (e.g. unboxing, UGC, fashion).
2) The user's message — their wishes, product name, key points.
3) Reference image(s) of the product.

Your task: output a single, final prompt in English for image-to-video generation. The prompt will be used together with the same reference image(s), so it must accurately describe what is in the image(s) and how the video should unfold.

Rules:
- Preserve the style and structure from the template prompt (unboxing / UGC / fashion / etc.).
- If images are provided: describe the product precisely (appearance, colors, packaging, setting) so the video matches the product; do not invent details that are not visible.
- Weave in the user's message naturally (product name, highlights, tone).
- Add brief, stable-motion instructions: smooth camera movement, product remains clearly visible and physically consistent, no morphing or disappearance, professional result.
- Output only the final prompt text, in English. No explanations, no preamble.
TEXT;

    /**
     * @param  int|null  $generationJobId  для связи с задачей генерации и статистики
     * @param  int|null  $userId  пользователь, для статистики
     */
    public function merge(
        string $templatePrompt,
        string $userPrompt,
        ?int $generationJobId = null,
        ?int $userId = null
    ): string {
        $userPromptTrimmed = trim($userPrompt);

        if ($userPromptTrimmed === '') {
            $merged = $templatePrompt;
            $this->logPrompt($templatePrompt, $userPrompt, $merged, OpenaiPromptLog::SOURCE_FALLBACK_EMPTY_PROMPT, null, $generationJobId, $userId);

            return $merged;
        }

        $apiKey = config('services.openai.api_key');
        if (empty($apiKey)) {
            $merged = $templatePrompt . "\n\nДополнение от пользователя: " . $userPromptTrimmed;
            $this->logPrompt($templatePrompt, $userPromptTrimmed, $merged, OpenaiPromptLog::SOURCE_FALLBACK_NO_KEY, null, $generationJobId, $userId);

            return $merged;
        }

        try {
            [$merged, $apiError] = $this->callOpenAi($templatePrompt, $userPromptTrimmed);
            if ($merged !== null && $merged !== '') {
                $this->logPrompt($templatePrompt, $userPromptTrimmed, $merged, OpenaiPromptLog::SOURCE_OPENAI_SUCCESS, null, $generationJobId, $userId);

                return $merged;
            }
            $fallback = $templatePrompt . "\n\nДополнение от пользователя: " . $userPromptTrimmed;
            $this->logPrompt($templatePrompt, $userPromptTrimmed, $fallback, OpenaiPromptLog::SOURCE_OPENAI_FAILED, $apiError ?? 'OpenAI вернул пустой ответ', $generationJobId, $userId);

            return $fallback;
        } catch (\Throwable $e) {
            Log::warning('PromptMergeService::merge OpenAI failed', ['error' => $e->getMessage()]);
            $fallback = $templatePrompt . "\n\nДополнение от пользователя: " . $userPromptTrimmed;
            $this->logPrompt($templatePrompt, $userPromptTrimmed, $fallback, OpenaiPromptLog::SOURCE_OPENAI_FAILED, $e->getMessage(), $generationJobId, $userId);

            return $fallback;
        }
    }

    /**
     * Мерж промпта с учётом фото продукта (vision). GPT анализирует изображения и подгоняет промпт под продукт.
     *
     * @param  array<int, array{disk: string, path: string}>  $imageItems  элементы [disk => 'local'|'public', path => относительный путь]
     * @param  int|null  $generationJobId
     * @param  int|null  $userId
     */
    public function mergeWithVision(
        string $templatePrompt,
        string $userPrompt,
        array $imageItems,
        ?int $generationJobId = null,
        ?int $userId = null
    ): string {
        $userPromptTrimmed = trim($userPrompt);

        $apiKey = config('services.openai.api_key');
        if (empty($apiKey)) {
            return $this->merge($templatePrompt, $userPrompt, $generationJobId, $userId);
        }

        $content = $this->buildVisionUserContent($templatePrompt, $userPromptTrimmed, $imageItems);
        if ($content === null) {
            Log::warning('PromptMergeService::mergeWithVision: no valid images, fallback to text merge');
            return $this->merge($templatePrompt, $userPrompt, $generationJobId, $userId);
        }

        try {
            [$merged, $apiError] = $this->callOpenAiWithVision($content);
            if ($merged !== null && $merged !== '') {
                $this->logPrompt($templatePrompt, $userPromptTrimmed, $merged, OpenaiPromptLog::SOURCE_OPENAI_VISION_SUCCESS, null, $generationJobId, $userId);

                return $merged;
            }
            $fallback = $templatePrompt . "\n\nДополнение от пользователя: " . $userPromptTrimmed;
            $this->logPrompt($templatePrompt, $userPromptTrimmed, $fallback, OpenaiPromptLog::SOURCE_OPENAI_VISION_FAILED, $apiError ?? 'OpenAI vision вернул пустой ответ', $generationJobId, $userId);

            return $fallback;
        } catch (\Throwable $e) {
            Log::warning('PromptMergeService::mergeWithVision OpenAI failed', ['error' => $e->getMessage()]);
            $fallback = $templatePrompt . "\n\nДополнение от пользователя: " . $userPromptTrimmed;
            $this->logPrompt($templatePrompt, $userPromptTrimmed, $fallback, OpenaiPromptLog::SOURCE_OPENAI_VISION_FAILED, $e->getMessage(), $generationJobId, $userId);

            return $fallback;
        }
    }

    /**
     * Собирает content для user message: текст + блоки image_url (data URL) для OpenAI.
     *
     * @param  array<int, array{disk: string, path: string}>  $imageItems
     * @return array<int, array{type: string, text?: string, image_url?: array}>|null null если не удалось прочитать ни одного изображения
     */
    private function buildVisionUserContent(string $templatePrompt, string $userPrompt, array $imageItems): ?array
    {
        $textBlock = [
            'type' => 'text',
            'text' => "Template prompt (style and structure):\n\n---\n" . $templatePrompt . "\n---\n\nUser's message:\n\n---\n" . ($userPrompt !== '' ? $userPrompt : '(no additional text)') . "\n---\n\nReference image(s) of the product are attached. Describe the product accurately in your output (what you see: object, colors, packaging, context) so the video generation matches the product. Keep the template style.",
        ];
        $content = [$textBlock];

        foreach ($imageItems as $item) {
            $disk = $item['disk'] ?? 'public';
            $path = $item['path'] ?? '';
            if ($path === '') {
                continue;
            }
            if (!Storage::disk($disk)->exists($path)) {
                continue;
            }
            $mime = Storage::disk($disk)->mimeType($path) ?: 'image/jpeg';
            $raw = Storage::disk($disk)->get($path);
            if ($raw === '' || $raw === false) {
                continue;
            }
            $b64 = base64_encode($raw);
            $dataUrl = 'data:' . $mime . ';base64,' . $b64;
            $content[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => $dataUrl,
                    'detail' => 'low',
                ],
            ];
        }

        if (count($content) <= 1) {
            return null;
        }

        return $content;
    }

    /**
     * @return array{0: string|null, 1: string|null} [merged_prompt, error_message]
     */
    private function callOpenAiWithVision(array $userContent): array
    {
        $proxy = config('services.openai.proxy');
        $client = Http::withToken(config('services.openai.api_key'))->timeout(60);
        if (!empty($proxy)) {
            $client = $client->withOptions(['proxy' => $proxy]);
        }
        $response = $client->post(self::OPENAI_URL, [
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => self::SYSTEM_PROMPT_VISION],
                ['role' => 'user', 'content' => $userContent],
            ],
            'max_tokens' => 5000,
        ]);

        if (!$response->successful()) {
            $errorMsg = sprintf('HTTP %d: %s', $response->status(), $response->body());
            Log::warning('OpenAI chat/completions (vision) failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [null, $errorMsg];
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? null;
        $merged = $content ? trim($content) : null;

        return [$merged, null];
    }

    private function logPrompt(
        string $templatePrompt,
        string $userPrompt,
        string $mergedPrompt,
        string $source,
        ?string $openaiError,
        ?int $generationJobId,
        ?int $userId
    ): void {
        try {
            OpenaiPromptLog::create([
                'generation_job_id' => $generationJobId,
                'user_id' => $userId,
                'template_prompt' => $templatePrompt,
                'user_prompt' => $userPrompt,
                'merged_prompt' => $mergedPrompt,
                'source' => $source,
                'openai_error' => $openaiError,
            ]);
        } catch (\Throwable $e) {
            Log::warning('OpenaiPromptLog::create failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @return array{0: string|null, 1: string|null} [merged_prompt, error_message]
     */
    private function callOpenAi(string $templatePrompt, string $userPrompt): array
    {
        $proxy = config('services.openai.proxy');
        $client = Http::withToken(config('services.openai.api_key'))->timeout(30);
        if (!empty($proxy)) {
            $client = $client->withOptions(['proxy' => $proxy]);
        }
        $response = $client->post(self::OPENAI_URL, [
            'model' => 'gpt-4o-mini',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Ты помогаешь объединить шаблонный промпт для генерации рекламного видео с пожеланиями пользователя для VEO3.'
                        . 'Верни один итоговый промпт на английском языке: сохрани стиль и структуру шаблона, органично встрой описание продукта/пожелания пользователя. '
                        . 'Ответь только текстом итогового промпта, без пояснений.',
                ],
                [
                    'role' => 'user',
                    'content' => "Шаблонный промпт:\n\n" . $templatePrompt . "\n\nПожелания пользователя:\n\n" . $userPrompt,
                ],
            ],
            'max_tokens' => 5000,
        ]);

        if (!$response->successful()) {
            $errorMsg = sprintf('HTTP %d: %s', $response->status(), $response->body());
            Log::warning('OpenAI chat/completions failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [null, $errorMsg];
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? null;
        $merged = $content ? trim($content) : null;

        return [$merged, null];
    }
}
