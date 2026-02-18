<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StartGenerationRequest;
use App\Jobs\ProcessGenerationJob;
use App\Models\GenerationJob;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerationController extends Controller
{
    /**
     * Список видео текущего пользователя (генерации: в процессе и готовые).
     */
    public function myVideos(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if (!$userId) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $jobs = GenerationJob::where('user_id', $userId)
            ->with('template:id,category,description,preview_url')
            ->orderByDesc('created_at')
            ->get();

        $data = $jobs->map(function (GenerationJob $job) {
            $template = $job->template;
            return [
                'id' => $job->id,
                'status' => $job->status,
                'video_url' => $job->status === GenerationJob::STATUS_COMPLETED && $job->video_path
                    ? $job->video_path
                    : null,
                'error_message' => $job->error_message,
                'created_at' => $job->created_at->toIso8601String(),
                'template' => $template ? [
                    'id' => $template->id,
                    'category' => $template->category,
                    'description' => $template->description,
                    'preview_url' => $template->preview_url,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $data,
            'meta' => ['total' => $data->count()],
        ]);
    }

    public function start(StartGenerationRequest $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->hasCredits(1)) {
            return response()->json([
                'error' => ['message' => 'Недостаточно кредитов', 'code' => 402, 'details' => []],
            ], 402);
        }

        $template = Template::find($request->validated('template_id'));
        $userPrompt = (string) $request->input('prompt', '');

        $user->spendCredits(1);

        $job = GenerationJob::create([
            'user_id' => $request->user()?->id,
            'template_id' => $template->id,
            'status' => GenerationJob::STATUS_PENDING,
            'user_prompt' => $userPrompt,
            'input' => null,
        ]);

        if ($request->hasFile('images')) {
            $dir = 'generation-input/' . $job->id;
            $storedPaths = [];
            foreach ($request->file('images') as $file) {
                $path = $file->store($dir, 'local');
                $storedPaths[] = $path;
            }
            $job->update(['input' => ['stored_paths' => $storedPaths]]);
        }

        ProcessGenerationJob::dispatch($job);
        Log::info('[Generation] Задача поставлена в очередь', ['job_id' => $job->id]);

        return response()->json(['data' => ['job_id' => $job->id]], 201);
    }

    public function status(Request $request, int $jobId): JsonResponse
    {
        $job = GenerationJob::where('id', $jobId)->where('user_id', $request->user()?->id)->first();
        if (!$job) {
            return response()->json(['error' => ['message' => 'Not Found', 'code' => 404, 'details' => []]], 404);
        }

        $videoUrl = $job->status === GenerationJob::STATUS_COMPLETED && $job->video_path
            ? $job->video_path
            : null;

        return response()->json([
            'data' => [
                'job_id' => $job->id,
                'status' => $job->status,
                'video_url' => $videoUrl,
                'error_message' => $job->error_message,
            ],
        ]);
    }
}
