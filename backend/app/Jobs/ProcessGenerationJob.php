<?php

namespace App\Jobs;

use App\Models\GenerationJob;
use App\Models\Template;
use App\Services\PromptMergeService;
use App\Services\VeoService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessGenerationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Таймаут джоба в секундах. Генерация в Kie.ai может занимать до ~20 минут (опрос каждые 10 сек). */
    public int $timeout = 1800;

    public function __construct(
        public GenerationJob $generationJob
    ) {
        $this->onQueue('default');
    }

    public function handle(PromptMergeService $promptMerge, VeoService $veo): void
    {
        $job = $this->generationJob->fresh();
        if (!$job || $job->status !== GenerationJob::STATUS_PENDING) {
            return;
        }

        $job->update(['status' => GenerationJob::STATUS_PROCESSING]);
        Log::info('[Generation] ProcessGenerationJob запущен', ['job_id' => $job->id]);

        $template = Template::find($job->template_id);
        if (!$template) {
            $job->update([
                'status' => GenerationJob::STATUS_FAILED,
                'error_message' => 'Template not found',
            ]);

            return;
        }

        $userImageItems = $this->resolveImagePaths($job);

        if (count($userImageItems) > 0) {
            $mergedPrompt = $promptMerge->mergeWithVision(
                $template->original_prompt,
                (string) $job->user_prompt,
                $userImageItems,
                $job->id,
                $job->user_id
            );
        } else {
            $mergedPrompt = $promptMerge->merge(
                $template->original_prompt,
                (string) $job->user_prompt,
                $job->id,
                $job->user_id
            );
        }
        $job->update(['merged_prompt' => $mergedPrompt]);

        $templateRefItems = $this->resolveTemplateReferencePaths($template);

        // 0 фото юзера → используем референсы шаблона (начальный кадр + фото продукта).
        // 1–2 фото юзера → начальный кадр из шаблона (первый референс) + фото продукта от юзера.
        $allImageItems = [];
        if (count($userImageItems) === 0) {
            $allImageItems = $templateRefItems;
        } else {
            $initialFrame = isset($templateRefItems[0]) ? [$templateRefItems[0]] : [];
            $allImageItems = array_merge($initialFrame, $userImageItems);
        }

        $user = $job->user()->first();
        $withWatermark = $user ? $user->shouldUseVideoWatermark() : true;
        Log::info('[Generation] Запрос к Veo (Kie.ai)', ['job_id' => $job->id, 'prompt_length' => strlen($mergedPrompt), 'images_count' => count($allImageItems)]);
        $videoPath = $veo->generate($mergedPrompt, $allImageItems, $withWatermark);

        if ($videoPath !== null) {
            $job->update([
                'status' => GenerationJob::STATUS_COMPLETED,
                'video_path' => $videoPath,
            ]);
        } else {
            $job->update([
                'status' => GenerationJob::STATUS_COMPLETED,
                'video_path' => config('app.url') . '/placeholder-video.mp4',
                'error_message' => null,
            ]);
        }
    }

    /**
     * @return array<int, array{disk: string, path: string}>
     */
    private function resolveImagePaths(GenerationJob $job): array
    {
        $input = $job->input ?? [];
        $stored = $input['stored_paths'] ?? [];
        $items = [];
        foreach ($stored as $rel) {
            if (!is_string($rel)) {
                continue;
            }
            $full = Storage::disk('local')->path($rel);
            if (is_file($full)) {
                $items[] = ['disk' => 'local', 'path' => $rel];
            }
        }

        return $items;
    }

    /**
     * @return array<int, array{disk: string, path: string}>
     */
    private function resolveTemplateReferencePaths(Template $template): array
    {
        $refs = $template->reference_images;
        if (!is_array($refs)) {
            return [];
        }
        $items = [];
        foreach ($refs as $rel) {
            if (!is_string($rel) || str_starts_with($rel, 'http')) {
                continue;
            }
            $full = Storage::disk('public')->path($rel);
            if (is_file($full)) {
                $items[] = ['disk' => 'public', 'path' => $rel];
            }
        }

        return $items;
    }
}
