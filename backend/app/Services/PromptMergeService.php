<?php

namespace App\Services;

use App\Models\OpenaiPromptLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Сливает исходный промпт шаблона с описанием пользователя.
 * Если задан OPENAI_API_KEY — запрос к ChatGPT, иначе простая конкатенация.
 * Каждый вызов логируется в openai_prompt_logs для статистики.
 */
class PromptMergeService
{
    private const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

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
