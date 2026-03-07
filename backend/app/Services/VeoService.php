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
     * @return array{final: string, original: string, watermarked: ?string}|null
     *         final       — URL, который сейчас нужно показывать пользователю
     *         original    — URL оригинального видео без вотермарки
     *         watermarked — URL видео с вотермаркой (null, если не применялась или не удалась)
     */
    public function generate(string $prompt, array $imageItems = [], bool $withWatermark = false): ?array
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

                    $watermarkedUrl = null;
                    if ($withWatermark) {
                        $wm = $this->applyGridWatermark($savedUrl, 'veydo.cc');
                        // Если вотермарка не применилась (вернулся тот же URL), считаем, что её нет.
                        $watermarkedUrl = $wm !== $savedUrl ? $wm : null;
                    }

                    $finalUrl = $withWatermark && $watermarkedUrl ? $watermarkedUrl : $savedUrl;

                    return [
                        'final' => $finalUrl,
                        'original' => $savedUrl,
                        'watermarked' => $watermarkedUrl,
                    ];
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
     * Утилита для ручной проверки водяного знака:
     * скачивает видео по URL, применяет тот же grid-watermark и возвращает URL результата.
     */
    public function debugWatermarkFromUrl(string $videoUrl, string $watermarkText = 'veydo.cc'): ?string
    {
        $savedUrl = $this->downloadAndSave($videoUrl);
        if (!$savedUrl) {
            return null;
        }

        return $this->applyGridWatermark($savedUrl, $watermarkText);
    }

    /**
     * Преобразует элементы [disk, path] в публичные URL для Kie API.
     * — public: Storage::url().
     * — local: копируем во временную публичную папку и отдаём прямой URL (Kie не поддерживает подписанные ссылки за прокси).
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
                $publicUrl = $this->copyLocalToPublicTemp($path);
                if ($publicUrl !== null) {
                    $urls[] = $publicUrl;
                }
            }
        }

        return $urls;
    }

    /**
     * Копирует файл из local (например chat-input/) в публичную временную папку и возвращает полный URL.
     * Kie.ai запрашивает картинки по URL; подписанные ссылки за прокси дают 403, поэтому отдаём прямой URL.
     */
    private function copyLocalToPublicTemp(string $localPath): ?string
    {
        $content = Storage::disk('local')->get($localPath);
        if ($content === null || $content === '') {
            return null;
        }
        $ext = pathinfo($localPath, PATHINFO_EXTENSION) ?: 'jpg';
        $safeExt = preg_match('/^[a-z0-9]+$/i', $ext) ? $ext : 'jpg';
        $tempPath = 'generation-temp/' . uniqid('img_', true) . '.' . $safeExt;
        Storage::disk('public')->put($tempPath, $content);
        return URL::to(Storage::disk('public')->url($tempPath));
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
        $overlayPath = null;
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

            [$videoW, $videoH] = $this->getVideoDimensions($input);
            $overlayPath = $this->createWatermarkOverlayPng($videoW, $videoH, $watermarkText);
            if (!$overlayPath || !is_file($overlayPath)) {
                return $videoUrl;
            }

            $ffmpeg = env('FFMPEG_BINARY', 'ffmpeg');
            $process = new Process([
                $ffmpeg,
                '-y',
                '-i',
                $input,
                '-i',
                $overlayPath,
                '-filter_complex',
                '[0:v][1:v]overlay=0:0:format=auto',
                '-c:v',
                'libx264',
                '-preset',
                'veryfast',
                '-crf',
                '22',
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
        } finally {
            if (is_string($overlayPath) && is_file($overlayPath)) {
                @unlink($overlayPath);
            }
        }
    }

    /**
     * @return array{0:int,1:int}
     */
    private function getVideoDimensions(string $videoPath): array
    {
        $ffprobe = env('FFPROBE_BINARY', 'ffprobe');
        $process = new Process([
            $ffprobe,
            '-v',
            'error',
            '-select_streams',
            'v:0',
            '-show_entries',
            'stream=width,height',
            '-of',
            'csv=p=0:s=x',
            $videoPath,
        ]);
        $process->setTimeout(20);
        $process->run();
        if (!$process->isSuccessful()) {
            return [720, 1280];
        }
        $out = trim($process->getOutput());
        if (!preg_match('/^(\d+)x(\d+)$/', $out, $m)) {
            return [720, 1280];
        }
        $w = max(1, (int) $m[1]);
        $h = max(1, (int) $m[2]);

        return [$w, $h];
    }

    private function createWatermarkOverlayPng(int $width, int $height, string $text): ?string
    {
        if ($width <= 0 || $height <= 0 || !function_exists('imagecreatetruecolor')) {
            return null;
        }

        $canvas = imagecreatetruecolor($width, $height);
        if (!$canvas) {
            return null;
        }
        imagealphablending($canvas, true);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);

        [$txt, $tileW] = $this->makeWatermarkTextTile($text, $height);
        if (!$txt) {
            imagedestroy($canvas);
            return null;
        }
        $txtBg = imagecolorallocatealpha($txt, 0, 0, 0, 127);

        $rotated = imagerotate($txt, -28, $txtBg);
        imagedestroy($txt);
        if (!$rotated) {
            imagedestroy($canvas);
            return null;
        }
        imagealphablending($rotated, true);
        imagesavealpha($rotated, true);

        $rw = imagesx($rotated);
        $rh = imagesy($rotated);

        // Ровно 5 диагональных меток по всей площади видео.
        $usableW = max(1, $width - $rw);
        $usableH = max(1, $height - $rh);
        // Пропорциональное покрытие всей площади кадра (5 зон).
        $points = [
            [0.08, 0.12], // верх-лево
            [0.76, 0.14], // верх-право
            [0.42, 0.46], // центр
            [0.12, 0.78], // низ-лево
            [0.74, 0.80], // низ-право
        ];
        foreach ($points as [$px, $py]) {
            $x = (int) round($usableW * $px);
            $y = (int) round($usableH * $py);
            imagecopy($canvas, $rotated, $x, $y, 0, 0, $rw, $rh);
        }

        imagedestroy($rotated);

        $tmpBase = tempnam(sys_get_temp_dir(), 'wm_overlay_');
        if (!$tmpBase) {
            imagedestroy($canvas);
            return null;
        }
        $pngPath = $tmpBase . '.png';
        @unlink($tmpBase);
        imagepng($canvas, $pngPath);
        imagedestroy($canvas);

        return is_file($pngPath) ? $pngPath : null;
    }

    /**
     * @return array{0:GdImage|null,1:int} [tile, tileWidth]
     */
    private function makeWatermarkTextTile(string $text, int $videoHeight): array
    {
        $fontPath = $this->resolveTtfFontPath();
        $fontSize = max(24, (int) round($videoHeight * 0.045));

        if ($fontPath && function_exists('imagettfbbox') && function_exists('imagettftext')) {
            $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
            if (is_array($bbox)) {
                $textW = max(1, (int) abs(($bbox[2] ?? 0) - ($bbox[0] ?? 0)));
                $textH = max(1, (int) abs(($bbox[7] ?? 0) - ($bbox[1] ?? 0)));
                $padX = 22;
                $padY = 22;
                $tileW = $textW + $padX * 2;
                $tileH = $textH + $padY * 2;
                $img = imagecreatetruecolor($tileW, $tileH);
                if ($img) {
                    imagealphablending($img, true);
                    imagesavealpha($img, true);
                    $bg = imagecolorallocatealpha($img, 0, 0, 0, 127);
                    imagefill($img, 0, 0, $bg);
                    $color = imagecolorallocatealpha($img, 255, 255, 255, 102);
                    imagettftext($img, $fontSize, 0, $padX, $padY + $textH, $color, $fontPath, $text);
                    return [$img, $tileW];
                }
            }
        }

        // Fallback, если TTF недоступен.
        $font = 5;
        $textW = imagefontwidth($font) * max(1, strlen($text));
        $textH = imagefontheight($font);
        $tileW = $textW + 20;
        $tileH = $textH + 20;
        $img = imagecreatetruecolor($tileW, $tileH);
        if (!$img) {
            return [null, 0];
        }
        imagealphablending($img, true);
        imagesavealpha($img, true);
        $bg = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefill($img, 0, 0, $bg);
        $color = imagecolorallocatealpha($img, 255, 255, 255, 102);
        imagestring($img, $font, 10, 8, $text, $color);

        return [$img, $tileW];
    }

    private function resolveTtfFontPath(): ?string
    {
        $envPath = env('WATERMARK_FONT_PATH');
        if (is_string($envPath) && $envPath !== '' && is_file($envPath)) {
            return $envPath;
        }

        $projectCandidates = [
            base_path('resources/fonts/veydo-watermark.ttf'),
            base_path('resources/fonts/DejaVuSans.ttf'),
        ];
        foreach ($projectCandidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        // 3) Типичные системные пути: сначала macOS, затем Linux.
        $candidates = [
            // macOS
            '/System/Library/Fonts/Supplemental/Arial.ttf',
            '/Library/Fonts/Arial.ttf',
            '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
            '/System/Library/Fonts/Supplemental/Helvetica.ttc',
            // Linux
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            '/usr/share/fonts/opentype/noto/NotoSans-Regular.otf',
        ];
        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }
}
