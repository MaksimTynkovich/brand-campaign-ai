<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Клиент API Kie.ai Veo 3.1.
 * Документация: https://docs.kie.ai/veo3-api/generate-veo-3-video
 *
 * — Создание задачи: POST /api/v1/veo/generate
 * — Статус задачи: GET /api/v1/veo/record-info?taskId=...
 */
class KieVeoService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.kie_veo.base_url', 'https://api.kie.ai'), '/');
        $this->apiKey = config('services.kie_veo.api_key', '');
    }

    /**
     * Создать задачу генерации видео.
     *
     * @param string $prompt Текстовый промпт
     * @param array<int, string> $imageUrls Публичные URL изображений (1–2 для image-to-video, 1–3 для REFERENCE_2_VIDEO)
     * @param string $aspectRatio 16:9 | 9:16 | Auto
     * @param string $model veo3 | veo3_fast
     * @return string|null taskId или null при ошибке
     */
    public function createTask(
        string $prompt,
        array $imageUrls = [],
        string $aspectRatio = '9:16',
        string $model = 'veo3_fast'
    ): ?string {
        if ($this->apiKey === '') {
            Log::warning('KieVeoService: KIE_VEO_API_KEY не задан');

            return null;
        }

        $url = $this->baseUrl . '/api/v1/veo/generate';
        $body = [
            'prompt' => $prompt,
            'model' => $model,
            'aspect_ratio' => $aspectRatio,
            'generationType' => empty($imageUrls) ? 'TEXT_2_VIDEO' : (count($imageUrls) >= 2 ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'REFERENCE_2_VIDEO'),
            'enableTranslation' => true,
        ];

        if ($imageUrls !== []) {
            $body['imageUrls'] = array_values($imageUrls);
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(60)
            ->asJson()
            ->post($url, $body);

        if (!$response->successful()) {
            Log::warning('KieVeoService::createTask failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $data = $response->json();
        $code = $data['code'] ?? 0;
        if ($code !== 200) {
            Log::warning('KieVeoService::createTask API error', [
                'code' => $code,
                'msg' => $data['msg'] ?? '',
            ]);

            return null;
        }

        $taskId = $data['data']['taskId'] ?? null;
        if (is_string($taskId)) {
            Log::info('[KieVeo] Задача создана', ['taskId' => $taskId]);
        }

        return is_string($taskId) ? $taskId : null;
    }

    /**
     * Получить статус и результат задачи.
     *
     * @return array{successFlag: int, resultUrls: array, errorMessage: string|null}
     *         successFlag: 0=в процессе, 1=успех, 2=ошибка, 3=генерация не удалась
     */
    public function getTaskDetails(string $taskId): array
    {
        $url = $this->baseUrl . '/api/v1/veo/record-info';
        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->get($url, ['taskId' => $taskId]);

        $default = [
            'successFlag' => 2,
            'resultUrls' => [],
            'errorMessage' => 'Request failed',
        ];

        if (!$response->successful()) {
            Log::warning('KieVeoService::getTaskDetails failed', ['status' => $response->status()]);

            return $default;
        }

        $data = $response->json();
        if (($data['code'] ?? 0) !== 200) {
            return [
                'successFlag' => 2,
                'resultUrls' => [],
                'errorMessage' => $data['msg'] ?? 'API error',
            ];
        }

        $record = $data['data'] ?? [];
        $successFlag = (int) ($record['successFlag'] ?? 2);
        $responseBlock = $record['response'] ?? [];
        $resultUrls = $responseBlock['resultUrls'] ?? [];
        if (is_string($resultUrls)) {
            $resultUrls = $resultUrls ? json_decode($resultUrls, true) ?? [] : [];
        }
        if (!is_array($resultUrls)) {
            $resultUrls = [];
        }
        $errorMessage = $record['errorMessage'] ?? null;

        return [
            'successFlag' => $successFlag,
            'resultUrls' => $resultUrls,
            'errorMessage' => is_string($errorMessage) ? $errorMessage : null,
        ];
    }
}
