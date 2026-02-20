<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarouselController extends Controller
{
    private const CAROUSEL_KEY = 'carousel_template_ids';

    /**
     * Публичный endpoint: шаблоны для карусели на главной (только с видео).
     */
    public function index(): JsonResponse
    {
        $ids = $this->getCarouselIds();
        if (empty($ids)) {
            return response()->json(['data' => []]);
        }

        $templates = Template::whereIn('id', $ids)
            ->whereNotNull('example_video_path')
            ->get(['id', 'category', 'description', 'preview_url', 'example_video_path']);

        $orderMap = array_flip($ids);
        $sorted = $templates->sortBy(fn ($t) => $orderMap[$t->id] ?? 999)->values();

        $data = $sorted->map(function (Template $t) {
            return [
                'id' => $t->id,
                'description' => $t->description,
                'preview_url' => $t->preview_url,
                'example_video_url' => $t->example_video_url,
            ];
        })->toArray();

        return response()->json(['data' => $data]);
    }

    /**
     * Админ: текущий список ID карусели + все шаблоны с видео для выбора.
     */
    public function adminIndex(): JsonResponse
    {
        $ids = $this->getCarouselIds();
        $templatesWithVideo = Template::whereNotNull('example_video_path')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'category', 'description', 'preview_url', 'example_video_path']);

        return response()->json([
            'carousel_template_ids' => $ids,
            'templates' => $templatesWithVideo->map(function (Template $t) {
                return [
                    'id' => $t->id,
                    'category' => $t->category,
                    'description' => $t->description,
                    'preview_url' => $t->preview_url,
                    'example_video_url' => $t->example_video_url,
                ];
            })->toArray(),
        ]);
    }

    /**
     * Админ: сохранить порядок шаблонов в карусели.
     */
    public function adminUpdate(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'template_ids' => 'required|array',
            'template_ids.*' => 'integer|exists:templates,id',
        ])['template_ids'];

        DB::table('settings')->updateOrInsert(
            ['key' => self::CAROUSEL_KEY],
            ['value' => json_encode(array_values($ids))]
        );

        return response()->json(['carousel_template_ids' => array_values($ids)]);
    }

    private function getCarouselIds(): array
    {
        $row = DB::table('settings')->where('key', self::CAROUSEL_KEY)->first();
        if (!$row || !$row->value) {
            return [];
        }
        $decoded = json_decode($row->value, true);

        return is_array($decoded) ? $decoded : [];
    }
}
