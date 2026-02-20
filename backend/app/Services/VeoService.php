<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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
     * @param array<int, array{disk: string, path: string}> $imageItems Каждый элемент: disk ('local'|'public'), path (относительный)
     * @return string|null URL готового видео в нашем storage или null при ошибке/отсутствии ключа
     */
    public function generate(string $prompt, array $imageItems = []): ?string
    {
        $imageUrls = $this->resolveImageUrls($imageItems);
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
     * Преобразует элементы [disk, path] в публичные URL для Kie API.
     * — public: Storage::url().
     * — local: временная подписанная ссылка на api/generation/serve-image (Kie должен иметь доступ к APP_URL).
     */
    private function resolveImageUrls(array $imageItems): array
    {
        $urls = [];
        foreach ($imageItems as $item) {
            $disk = $item['disk'] ?? 'public';
            $path = $item['path'] ?? '';
            if ($path === '') {
                continue;
            }
            if ($disk === 'public' && Storage::disk('public')->exists($path)) {
                $urls[] = URL::to(Storage::disk('public')->url($path));
                continue;
            }
            if ($disk === 'local' && Storage::disk('local')->exists($path)) {
                $urls[] = URL::temporarySignedRoute(
                    'generation.serve-image',
                    now()->addMinutes(60),
                    ['path' => $path]
                );
            }
        }

        return $urls;
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
