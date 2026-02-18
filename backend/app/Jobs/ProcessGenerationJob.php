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

        $mergedPrompt = $promptMerge->merge($template->original_prompt, (string) $job->user_prompt);
        $job->update(['merged_prompt' => $mergedPrompt]);

        $userImagePaths = $this->resolveImagePaths($job);
        $templateRefPaths = $this->resolveTemplateReferencePaths($template);

        // 0 фото юзера → используем референсы шаблона (начальный кадр + фото продукта).
        // 1–2 фото юзера → начальный кадр из шаблона (первый референс) + фото продукта от юзера.
        $allImagePaths = [];
        if (count($userImagePaths) === 0) {
            $allImagePaths = $templateRefPaths;
        } else {
            $initialFramePath = isset($templateRefPaths[0]) ? [$templateRefPaths[0]] : [];
            $allImagePaths = array_merge($initialFramePath, $userImagePaths);
        }

        Log::info('[Generation] Запрос к Veo (Kie.ai)', ['job_id' => $job->id, 'prompt_length' => strlen($mergedPrompt)]);
        $videoPath = $veo->generate($mergedPrompt, $allImagePaths);

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

    private function resolveImagePaths(GenerationJob $job): array
    {
        $input = $job->input ?? [];
        $stored = $input['stored_paths'] ?? [];
        $paths = [];
        foreach ($stored as $rel) {
            $full = Storage::disk('local')->path($rel);
            if (is_file($full)) {
                $paths[] = $full;
            }
        }

        return $paths;
    }

    private function resolveTemplateReferencePaths(Template $template): array
    {
        $refs = $template->reference_images;
        if (!is_array($refs)) {
            return [];
        }
        $paths = [];
        foreach ($refs as $rel) {
            if (!is_string($rel) || str_starts_with($rel, 'http')) {
                continue;
            }
            $full = Storage::disk('public')->path($rel);
            if (is_file($full)) {
                $paths[] = $full;
            }
        }

        return $paths;
    }
}
