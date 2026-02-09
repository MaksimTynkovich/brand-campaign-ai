<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class TemplateController extends Controller
{
    private function getMockTemplates(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Удержание с хуком',
                'description' => 'Резкий хук в первые секунды, проблема — решение — CTA',
                'preview_url' => 'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6630cf2bebfaf8ed505a3_3video.webp',
                'default_voiceover' => "Не могу поверить, что это так работает! Смотри: [продукт] решает именно ту проблему, о которой все молчат. Перестань переплачивать — попробуй сам. Ссылка в шапке.",
                'sort_order' => 1,
            ],
            [
                'id' => 2,
                'name' => 'До и после',
                'description' => 'Классический формат сравнения до/после с эмоцией',
                'preview_url' => 'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6647328fdc175188398f1_4video.webp',
                'default_voiceover' => "Раньше я думала, что [проблема]. Пока не попробовала [продукт]. Результат за первую неделю — сама в шоке. Заказывай по ссылке.",
                'sort_order' => 2,
            ],
            [
                'id' => 3,
                'name' => 'Распаковка и восторг',
                'description' => 'UGC-распаковка с живой реакцией и призывом',
                'preview_url' => 'https://cdn.prod.website-files.com/67459e4d11ea8f89122689ca/68e6630c6385efed4bdfef33_8video.webp',
                'default_voiceover' => "Наконец-то приехало! Смотри, что внутри. Качество огонь, за такую цену — вообще подарок. Кто ещё не заказывал — ссылка в профиле.",
                'sort_order' => 3,
            ],
        ];
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->getMockTemplates()]);
    }
}
