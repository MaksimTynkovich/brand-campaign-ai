<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\Process\Process;

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
    public function generate(string $prompt, array $imageItems = [], bool $withWatermark = false): ?string
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
                    $savedUrl = $this->downloadAndSave($videoUrl);
                    if (!$savedUrl) {
                        return null;
                    }

                    return $withWatermark
                        ? $this->applyGridWatermark($savedUrl, 'veydo.cc')
                        : $savedUrl;
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

            $path = 'generation-output/' . uniqid('video_', true) . '.mp4';
            Storage::disk('public')->put($path, $response->body());
            Log::info('[VeoService] Видео сохранено', ['path' => $path]);

            return Storage::disk('public')->url($path);
        } catch (\Throwable $e) {
            Log::warning('VeoService::downloadAndSave failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function applyGridWatermark(string $videoUrl, string $watermarkText): string
    {
        try {
            $path = parse_url($videoUrl, PHP_URL_PATH);
            if (!$path || !str_starts_with($path, '/storage/')) {
                return $videoUrl;
            }

            $relative = ltrim(substr($path, strlen('/storage/')), '/');
            if (!Storage::disk('public')->exists($relative)) {
                return $videoUrl;
            }

            $input = Storage::disk('public')->path($relative);
            $outputRel = 'generation-output/' . uniqid('wm_video_', true) . '.mp4';
            $output = Storage::disk('public')->path($outputRel);
            $outputDir = dirname($output);
            if (!is_dir($outputDir)) {
                @mkdir($outputDir, 0775, true);
            }

            $filter = $this->buildGridWatermarkFilter($watermarkText);
            $ffmpeg = env('FFMPEG_BINARY', 'ffmpeg');
            $process = new Process([
                $ffmpeg,
                '-y',
                '-i',
                $input,
                '-vf',
                $filter,
                '-c:a',
                'copy',
                '-movflags',
                '+faststart',
                $output,
            ]);
            $process->setTimeout(300);
            $process->run();

            if (!$process->isSuccessful() || !is_file($output)) {
                Log::warning('VeoService: watermark failed, fallback to original', [
                    'error' => $process->getErrorOutput(),
                ]);
                return $videoUrl;
            }

            return URL::to('/storage/' . ltrim($outputRel, '/'));
        } catch (\Throwable $e) {
            Log::warning('VeoService::applyGridWatermark failed', ['error' => $e->getMessage()]);
            return $videoUrl;
        }
    }

    private function buildGridWatermarkFilter(string $text): string
    {
        $safeText = str_replace(['\\', ':', "'"], ['\\\\', '\:', "\\'"], $text);
        $parts = [];
        $xPositions = [0.04, 0.28, 0.52, 0.76];
        $yPositions = [0.08, 0.24, 0.40, 0.56, 0.72, 0.88];

        foreach ($yPositions as $y) {
            foreach ($xPositions as $x) {
                $parts[] = "drawtext=text='{$safeText}':fontcolor=white@0.24:fontsize=h*0.045:x=w*{$x}:y=h*{$y}";
            }
        }

        return implode(',', $parts);
    }
}
