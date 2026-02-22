<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

/**
 * Сжатие фото и видео при загрузке шаблонов (превью, пример видео, референсы).
 * Настройки — константы ниже: меняй значения и перезапускай приложение.
 */
class MediaOptimizerService
{
    /** Максимальная сторона изображения (пикселей). Больше — крупнее картинка и файл. */
    public const IMAGE_MAX_SIDE = 1920;

    /** Качество JPEG (1–100). Выше — лучше качество, больше размер. 85 — компромисс. */
    public const IMAGE_QUALITY = 70;

    /** Максимальное разрешение видео (ширина × высота). */
    public const VIDEO_MAX_WIDTH = 1920;
    public const VIDEO_MAX_HEIGHT = 1080;

    /** CRF видео (18–28). Меньше — лучше качество, больше файл. 23 — норма. */
    public const VIDEO_CRF = 28;

    /**
     * Оптимизирует загруженное изображение и сохраняет в указанный путь на диске.
     * Уменьшает размер по длинной стороне и сжимает с заданным качеством.
     *
     * @param  UploadedFile  $file  загруженный файл
     * @param  string  $diskPath  путь относительно диска (например templates/xxx.jpg)
     * @param  string  $disk  имя диска (по умолчанию public)
     * @return string тот же diskPath (файл перезаписан)
     */
    public function optimizeAndStoreImage(UploadedFile $file, string $diskPath, string $disk = 'public'): string
    {
        $fullPath = Storage::disk($disk)->path($diskPath);
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        try {
            $image = Image::read($file->getRealPath());
            $image->scaleDown(self::IMAGE_MAX_SIDE, self::IMAGE_MAX_SIDE);
            $ext = strtolower(pathinfo($diskPath, PATHINFO_EXTENSION));

            if (in_array($ext, ['jpg', 'jpeg'], true)) {
                $image->toJpeg(self::IMAGE_QUALITY)->save($fullPath);
            } elseif ($ext === 'webp') {
                $image->toWebp(self::IMAGE_QUALITY)->save($fullPath);
            } else {
                $image->save($fullPath);
            }

            Log::debug('MediaOptimizer: image optimized', ['path' => $diskPath]);
            return $diskPath;
        } catch (\Throwable $e) {
            Log::warning('MediaOptimizer: image optimization failed, storing original', [
                'path' => $diskPath,
                'error' => $e->getMessage(),
            ]);
            $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $fallbackPath = pathinfo($diskPath, PATHINFO_DIRNAME).'/'.pathinfo($diskPath, PATHINFO_FILENAME).'.'.$ext;
            $fullFallback = Storage::disk($disk)->path($fallbackPath);
            copy($file->getRealPath(), $fullFallback);
            return $fallbackPath;
        }
    }

    /**
     * Сохраняет загруженное изображение с оптимизацией.
     * Всегда сохраняет как JPEG (качество 85%), чтобы гарантировать сжатие независимо от формата загрузки.
     */
    public function storeOptimizedImage(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $filename = uniqid('', true).'.jpg';
        $diskPath = $directory.'/'.$filename;
        return $this->optimizeAndStoreImage($file, $diskPath, $disk);
    }

    /**
     * Оптимизирует видео через FFmpeg (если установлен): масштаб до max 1920x1080, H.264, CRF 23.
     * Если FFmpeg недоступен или ошибка — сохраняет оригинал без изменений.
     *
     * @param  UploadedFile  $file  загруженный файл
     * @param  string  $diskPath  путь относительно диска
     * @param  string  $disk  имя диска
     * @return string тот же diskPath
     */
    public function optimizeAndStoreVideo(UploadedFile $file, string $diskPath, string $disk = 'public'): string
    {
        $fullPath = Storage::disk($disk)->path($diskPath);
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $inputPath = $file->getRealPath();
        $tempOutput = $dir.'/'.'_opt_'.basename($fullPath);

        if ($this->runFfmpegCompress($inputPath, $tempOutput)) {
            @unlink($fullPath);
            rename($tempOutput, $fullPath);
            Log::debug('MediaOptimizer: video compressed', ['path' => $diskPath]);
            return $diskPath;
        }

        @unlink($tempOutput);
        Log::info('MediaOptimizer: video stored without compression (FFmpeg unavailable or failed)', ['path' => $diskPath]);
        $file->storeAs(dirname($diskPath), basename($diskPath), $disk);
        return $diskPath;
    }

    /**
     * Сохраняет видео с оптимизацией (если есть FFmpeg).
     */
    public function storeOptimizedVideo(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'mp4');
        if (!in_array($extension, ['mp4', 'webm', 'mov'], true)) {
            $extension = 'mp4';
        }
        $filename = uniqid('', true).'.'.$extension;
        $diskPath = $directory.'/'.$filename;
        return $this->optimizeAndStoreVideo($file, $diskPath, $disk);
    }

    private function runFfmpegCompress(string $inputPath, string $outputPath): bool
    {
        $ffmpeg = $this->findFfmpeg();
        if ($ffmpeg === null) {
            return false;
        }

        $w = self::VIDEO_MAX_WIDTH;
        $h = self::VIDEO_MAX_HEIGHT;
        $scale = "scale=min({$w}\\,iw):min({$h}\\,ih):force_original_aspect_ratio=decrease";

        $command = [
            $ffmpeg,
            '-i', $inputPath,
            '-vf', $scale,
            '-c:v', 'libx264',
            '-crf', (string) self::VIDEO_CRF,
            '-preset', 'medium',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            $outputPath,
        ];

        try {
            $process = new \Symfony\Component\Process\Process($command);
            $process->setTimeout(300);
            $process->run();
            if ($process->isSuccessful() && is_file($outputPath) && filesize($outputPath) > 0) {
                return true;
            }
            Log::warning('MediaOptimizer: ffmpeg produced no or empty output', [
                'output' => $process->getErrorOutput(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('MediaOptimizer: ffmpeg failed', ['error' => $e->getMessage()]);
        }

        return false;
    }

    private function findFfmpeg(): ?string
    {
        $candidates = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', 'ffmpeg'];
        foreach ($candidates as $bin) {
            if ($bin === 'ffmpeg') {
                $path = trim((string) shell_exec('which ffmpeg 2>/dev/null'));
                if ($path !== '' && is_executable($path)) {
                    return $path;
                }
                continue;
            }
            if (is_executable($bin)) {
                return $bin;
            }
        }
        return null;
    }
}
