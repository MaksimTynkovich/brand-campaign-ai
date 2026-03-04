<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateRequest;
use App\Http\Requests\UpdateTemplateRequest;
use App\Models\TemplateCategory;
use App\Models\Template;
use App\Services\MediaOptimizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class TemplateController extends Controller
{
    public function __construct(
        private MediaOptimizerService $mediaOptimizer
    ) {}

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Template::query()->orderBy('sort_order');
        $category = $request->query('category');
        if ($category !== null && $category !== '') {
            $query->where('category', $category);
        }
        $templates = $query->get([
            'id', 'category', 'description',
            'preview_url', 'example_video_path', 'default_voiceover', 'sort_order',
        ]);
        $categories = TemplateCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->toArray();

        return response()->json([
            'data' => $templates,
            'meta' => ['categories' => $categories],
        ]);
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $data = $request->safe()->except(['preview', 'example_video', 'reference_images']);
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $template = Template::create($data);

        if ($request->hasFile('example_video')) {
            $data['example_video_path'] = $this->mediaOptimizer->storeOptimizedVideo(
                $request->file('example_video'),
                'templates/videos',
                'public'
            );
            $template->update(['example_video_path' => $data['example_video_path']]);

            // Если превью не загружено отдельно — создаём его из первого кадра видео.
            if (!$request->hasFile('preview')) {
                $previewPath = $this->mediaOptimizer->extractVideoPreviewFrame(
                    $data['example_video_path'],
                    'templates/previews',
                    'public'
                );
                if ($previewPath) {
                    $template->update(['preview_url' => $previewPath]);
                }
            }
        } elseif ($request->hasFile('preview')) {
            // Если видео нет, но превью передано — сохраняем его как раньше.
            $data['preview_url'] = $this->mediaOptimizer->storeOptimizedImage(
                $request->file('preview'),
                'templates',
                'public'
            );
            $template->update(['preview_url' => $data['preview_url']]);
        }

        if ($request->hasFile('reference_images')) {
            $paths = [];
            foreach ($request->file('reference_images') as $file) {
                $paths[] = $this->mediaOptimizer->storeOptimizedImage(
                    $file,
                    'templates/reference/' . $template->id,
                    'public'
                );
            }
            $template->update(['reference_images' => $paths]);
        }

        return response()->json(['data' => $template->fresh()], 201);
    }

    public function show(Template $template): JsonResponse
    {
        return response()->json(['data' => $template]);
    }

    public function update(UpdateTemplateRequest $request, Template $template): JsonResponse
    {
        $data = $request->safe()->except(['preview', 'example_video', 'reference_images']);

        if ($request->hasFile('example_video')) {
            $raw = $template->getRawOriginal('example_video_path');
            if (is_string($raw) && !str_starts_with($raw, 'http')) {
                Storage::disk('public')->delete($raw);
            }
            $data['example_video_path'] = $this->mediaOptimizer->storeOptimizedVideo(
                $request->file('example_video'),
                'templates/videos',
                'public'
            );

            // Если превью не передано отдельно — обновляем превью из нового видео.
            if (!$request->hasFile('preview')) {
                $previewRaw = $template->getRawOriginal('preview_url');
                if ($previewRaw && !str_starts_with($previewRaw, 'http')) {
                    Storage::disk('public')->delete($previewRaw);
                }
                $previewPath = $this->mediaOptimizer->extractVideoPreviewFrame(
                    $data['example_video_path'],
                    'templates/previews',
                    'public'
                );
                if ($previewPath) {
                    $data['preview_url'] = $previewPath;
                }
            }
        }

        if ($request->hasFile('preview')) {
            $previewRaw = $template->getRawOriginal('preview_url');
            if ($previewRaw && !str_starts_with($previewRaw, 'http')) {
                Storage::disk('public')->delete($previewRaw);
            }
            $data['preview_url'] = $this->mediaOptimizer->storeOptimizedImage(
                $request->file('preview'),
                'templates',
                'public'
            );
        }

        if ($request->hasFile('reference_images')) {
            $oldRefs = $template->getRawOriginal('reference_images');
            if (is_array($oldRefs)) {
                foreach ($oldRefs as $path) {
                    if (is_string($path)) {
                        Storage::disk('public')->delete($path);
                    }
                }
            }
            $paths = [];
            foreach ($request->file('reference_images') as $file) {
                $paths[] = $this->mediaOptimizer->storeOptimizedImage(
                    $file,
                    'templates/reference/' . $template->id,
                    'public'
                );
            }
            $data['reference_images'] = $paths;
        }

        $template->update($data);

        return response()->json(['data' => $template->fresh()]);
    }

    public function destroy(Template $template): JsonResponse
    {
        $rawPreview = $template->getRawOriginal('preview_url');
        if ($rawPreview && !str_starts_with($rawPreview, 'http')) {
            Storage::disk('public')->delete($rawPreview);
        }
        $rawVideo = $template->getRawOriginal('example_video_path');
        if (is_string($rawVideo) && !str_starts_with($rawVideo, 'http')) {
            Storage::disk('public')->delete($rawVideo);
        }
        $template->delete();

        return response()->json(null, 204);
    }
}
