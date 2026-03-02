<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\VeoService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('video:watermark-test {url} {--text=veydo.cc}', function (VeoService $veo) {
    $url = (string) $this->argument('url');
    $text = (string) $this->option('text');

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        $this->error('Некорректный URL видео.');
        return 1;
    }

    $this->info('Скачиваю видео и накладываю watermark...');
    $result = $veo->debugWatermarkFromUrl($url, $text);

    if (!$result) {
        $this->error('Не удалось обработать видео.');
        return 1;
    }

    $this->info('Готово. Watermarked video URL:');
    $this->line($result);

    return 0;
})->purpose('Проверка наложения watermark на видео по URL');
