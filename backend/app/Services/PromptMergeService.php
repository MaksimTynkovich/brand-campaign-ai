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
You are a video prompt engineer and product interaction expert for an AI video generation model (VEO).

You always receive three types of input:

1) A TEMPLATE PROMPT
   – This defines the overall video style and structure (for example: unboxing, UGC, fashion clip, product demo, etc.).
   – You MUST preserve this style and structure in your final prompt.

2) A USER MESSAGE
   – This contains the user’s wishes, product name, target audience, tone, and any specific actions they ask for
     (for example: “spray twice”, “pour a small amount”, “open the box and show what’s inside”).

3) One or more PRODUCT REFERENCE IMAGES
   – These show the real product the user uploaded (for example: perfume bottle with a cap, cream jar with a lid,
     box with seals, clothing item, gadget with buttons, etc.).
   – You must rely on what you actually see in the images: shape, materials, labels, caps, lids, pumps, sprayers,
     buttons, zippers, packaging, etc.

Your task is to output ONE final prompt in English for image-to-video generation that:

- Respects the template style and structure.
  The final prompt should clearly match the format described by the template
  (unboxing / UGC / fashion / product demo / etc.).

- Accurately reflects the real product from the images.
  Describe the product as it truly appears: form factor, colors, packaging, materials, presence of caps, lids,
  pumps, sprayers, dispensers, zippers, buttons, etc. Do not invent details that are clearly not present.

- If the product described in the template prompt is different from the actual product in the reference images
  (for example: the template mentions a mug but the image clearly shows a perfume bottle),
  you MUST consistently update ALL product references in the final prompt to match the real product from the images.
  Do not leave inconsistent mentions (e.g. “mug” and “bottle” mixed).

- Uses strong real-world common sense about how the product is used.
  Before writing the final prompt, silently plan the scene step by step:
  - Infer what type of product this is (for example: spray perfume, pump bottle, cream jar, box, tube, clothing,
    shoes, electronics).
  - Infer how people normally interact with such a product in real life.
  - Whenever the user asks for an action that requires access to the product contents
    (for example: spraying, pumping, pouring, applying, drinking, using a dropper, etc.),
    you MUST explicitly include realistic preparation steps in the FINAL prompt BEFORE the requested action happens,
    even if the user did not mention them.

    Examples of preparation steps:
    - Remove caps, lids, covers, or outer protective elements.
    - Open or twist off caps or lids on bottles, jars, tubes, pumps and sprays.
    - Unpack or unwrap outer packaging (boxes, plastic wraps, stickers, seals, ties).
    - Hold the product in a realistic position and distance for that action.

  - If the reference images clearly show a cap, lid, or other closure on the product,
    ALWAYS describe how it is removed before spraying, pouring, or applying.
  - You are STRICT about real-world physical logic:
    never describe physically impossible or illogical actions for this product type
    (for example: spraying through a closed cap, pouring through a sealed lid, using buttons that are not visible),
    unless the user explicitly asks for surreal or impossible effects.
  - Assume products start in their realistic default state (closed, with caps or lids on, sealed packaging, etc.),
    unless the images clearly show them already open.

- Weaves the user’s wishes into a plausible, smooth mini-story.
  - Incorporate what the user wants (for example: “two sprays”, “slow rotation”, “show texture”, “focus on logo”,
    “relaxed TikTok UGC style”) into a realistic sequence of actions.
  - Preserve the intended tone (for example: premium, playful, minimal, bold, cozy).

- Produces visually stable, high-quality video instructions for VEO.
  Add concise instructions that improve visual quality and physical consistency, for example:
  - Smooth, stable camera movement (or natural handheld movement for UGC, if the template implies it).
  - The product remains clearly visible and does not morph or disappear.
  - Movements are clean and intentional (open → show → use → close, etc.).
  - Background, lighting, and framing match the template style.

OUTPUT RULES:

- First, silently reason about:
  - What the product is.
  - How it should realistically be handled based on the images.
  - How to combine the template style, user request, and product usage into one coherent scene.

- Then, output ONLY the final video prompt in English as plain text.
  - Do NOT show your reasoning or planning.
  - Do NOT output JSON or any extra commentary.
  - Return a single, self-contained prompt ready to be used as `prompt` for the video generation API.
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
