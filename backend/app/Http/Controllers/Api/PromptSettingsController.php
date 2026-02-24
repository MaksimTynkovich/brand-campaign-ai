<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PromptMergeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromptSettingsController extends Controller
{
    private const VISION_PROMPT_KEY = 'prompt_vision_system_prompt';

    public function __construct(
        private PromptMergeService $promptMerge
    ) {
    }

    /**
     * Текущие настройки промптов для AI (пока только vision system prompt).
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'vision_system_prompt' => $this->promptMerge->currentVisionPrompt(),
        ]);
    }

    /**
     * Обновить глобальный системный промпт для vision-мержа.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vision_system_prompt' => ['required', 'string'],
        ]);

        DB::table('settings')->updateOrInsert(
            ['key' => self::VISION_PROMPT_KEY],
            ['value' => $data['vision_system_prompt']]
        );

        return response()->json([
            'vision_system_prompt' => $data['vision_system_prompt'],
        ]);
    }
}

