<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTemplateCategoryRequest;
use App\Http\Requests\UpdateTemplateCategoryRequest;
use App\Models\Template;
use App\Models\TemplateCategory;
use Illuminate\Http\JsonResponse;

class TemplateCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = TemplateCategory::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'sort_order']);

        return response()->json(['data' => $categories]);
    }

    public function store(StoreTemplateCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $category = TemplateCategory::create($data);

        return response()->json(['data' => $category], 201);
    }

    public function update(UpdateTemplateCategoryRequest $request, TemplateCategory $templateCategory): JsonResponse
    {
        $oldName = $templateCategory->name;
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? 0;

        $templateCategory->update($data);

        // If name changed, keep templates.category in sync.
        if ($oldName !== $templateCategory->name) {
            Template::query()->where('category', $oldName)->update(['category' => $templateCategory->name]);
        }

        return response()->json(['data' => $templateCategory->fresh()]);
    }

    public function destroy(TemplateCategory $templateCategory): JsonResponse
    {
        $inUse = Template::query()->where('category', $templateCategory->name)->exists();
        if ($inUse) {
            return response()->json([
                'error' => [
                    'message' => 'Категория используется в шаблонах — сначала смените категорию у шаблонов',
                    'code' => 422,
                    'details' => [],
                ],
            ], 422);
        }

        $templateCategory->delete();

        return response()->json(['data' => true]);
    }
}

