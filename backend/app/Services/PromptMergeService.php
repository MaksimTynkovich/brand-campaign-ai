<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Сливает исходный промпт шаблона с описанием пользователя.
 * Если задан OPENAI_API_KEY — запрос к ChatGPT, иначе простая конкатенация.
 */
class PromptMergeService
{
    private const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

    public function merge(string $templatePrompt, string $userPrompt): string
    {
        $userPrompt = trim($userPrompt);
        if ($userPrompt === '') {
            return $templatePrompt;
        }

        $apiKey = config('services.openai.api_key');
        if (empty($apiKey)) {
            return $templatePrompt . "\n\nДополнение от пользователя: " . $userPrompt;
        }

        try {
            $merged = $this->callOpenAi($templatePrompt, $userPrompt);
            if ($merged !== null && $merged !== '') {
                return $merged;
            }
        } catch (\Throwable $e) {
            Log::warning('PromptMergeService::merge OpenAI failed', ['error' => $e->getMessage()]);
        }

        return $templatePrompt . "\n\nДополнение от пользователя: " . $userPrompt;
    }

    private function callOpenAi(string $templatePrompt, string $userPrompt): ?string
    {
        $response = Http::withToken(config('services.openai.api_key'))
            ->timeout(30)
            ->post(self::OPENAI_URL, [
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Ты помогаешь объединить шаблонный промпт для генерации рекламного видео с пожеланиями пользователя. '
                            . 'Верни один итоговый промпт на русском: сохрани стиль и структуру шаблона, органично встрой описание продукта/пожелания пользователя. '
                            . 'Ответь только текстом итогового промпта, без пояснений.',
                    ],
                    [
                        'role' => 'user',
                        'content' => "Шаблонный промпт:\n\n" . $templatePrompt . "\n\nПожелания пользователя:\n\n" . $userPrompt,
                    ],
                ],
                'max_tokens' => 2000,
            ]);

        if (!$response->successful()) {
            Log::warning('OpenAI chat/completions failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? null;

        return $content ? trim($content) : null;
    }
}
