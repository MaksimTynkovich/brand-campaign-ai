<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Генерация видео по промпту (и опционально изображениям).
 * Использует Kie.ai Veo 3.1 API (https://docs.kie.ai/veo3-api/generate-veo-3-video).
 * Если KIE_VEO_API_KEY не задан — возвращает null (контроллер подставит заглушку).
 */
class VeoService
{
    private const POLL_INTERVAL_SEC = 10;
    private const MAX_POLL_ATTEMPTS = 120;

    public function __construct(
        private KieVeoService $kieVeo
    ) {
    }

    /**
     * Запустить генерацию, дождаться результата, сохранить видео в storage.
     *
     * @param array<int, string> $imagePaths Пока не используются: Kie API ожидает публичные URL изображений
     * @return string|null URL готового видео в нашем storage или null при ошибке/отсутствии ключа
     */
    public function generate(string $prompt, array $imagePaths = []): ?string
    {
        $imageUrls = $this->resolveImageUrls($imagePaths);
        $taskId = $this->kieVeo->createTask($prompt, $imageUrls, '9:16', 'veo3_fast');

        if ($taskId === null) {
            Log::warning('VeoService: createTask вернул null (проверьте KIE_VEO_API_KEY и логи)');
            return null;
        }

        $attempt = 0;
        while ($attempt < self::MAX_POLL_ATTEMPTS) {
            if ($attempt > 0 && $attempt % 6 === 0) {
                Log::info('[KieVeo] Опрос статуса', ['taskId' => $taskId, 'attempt' => $attempt]);
            }
            $details = $this->kieVeo->getTaskDetails($taskId);
            $flag = $details['successFlag'];

            if ($flag === 1) {
                $urls = $details['resultUrls'];
                $videoUrl = is_array($urls) && count($urls) > 0 ? $urls[0] : null;
                if ($videoUrl) {
                    Log::info('[KieVeo] Генерация завершена, скачивание видео', ['taskId' => $taskId]);
                    return $this->downloadAndSave($videoUrl);
                }
                Log::warning('VeoService: successFlag=1 but no resultUrls', ['taskId' => $taskId]);

                return null;
            }

            if ($flag === 2 || $flag === 3) {
                Log::warning('VeoService: generation failed', [
                    'taskId' => $taskId,
                    'errorMessage' => $details['errorMessage'] ?? '',
                ]);

                return null;
            }

            $attempt++;
            sleep(self::POLL_INTERVAL_SEC);
        }

        Log::warning('VeoService: poll timeout', ['taskId' => $taskId]);

        return null;
    }

    /**
     * Сейчас изображения — локальные пути; Kie API нужны публичные URL.
     * Возвращаем пустой массив (только text-to-video). Позже можно добавить загрузку файлов в Kie и подстановку URL.
     */
    private function resolveImageUrls(array $imagePaths): array
    {
        return [];
    }

    private function downloadAndSave(string $videoUrl): ?string
    {
        try {
            $response = Http::timeout(120)->get($videoUrl);
            if (!$response->successful()) {
                Log::warning('VeoService: failed to download video', ['url' => $videoUrl]);

                return null;
            }

            $path = 'generation-output/' . uniqid('veo_', true) . '.mp4';
            Storage::disk('public')->put($path, $response->body());
            Log::info('[VeoService] Видео сохранено', ['path' => $path]);

            return Storage::disk('public')->url($path);
        } catch (\Throwable $e) {
            Log::warning('VeoService::downloadAndSave failed', ['error' => $e->getMessage()]);

            return null;
        }
    }
}
