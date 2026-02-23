<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OpenaiPromptLog extends Model
{
    public const SOURCE_OPENAI_SUCCESS = 'openai_success';
    public const SOURCE_OPENAI_FAILED = 'openai_failed';
    public const SOURCE_OPENAI_VISION_SUCCESS = 'openai_vision_success';
    public const SOURCE_OPENAI_VISION_FAILED = 'openai_vision_failed';
    public const SOURCE_FALLBACK_NO_KEY = 'fallback_no_key';
    public const SOURCE_FALLBACK_EMPTY_PROMPT = 'fallback_empty_prompt';
    public const SOURCE_FALLBACK_VISION_NO_KEY = 'fallback_vision_no_key';

    protected $fillable = [
        'generation_job_id',
        'user_id',
        'template_prompt',
        'user_prompt',
        'merged_prompt',
        'source',
        'openai_error',
    ];

    public function generationJob(): BelongsTo
    {
        return $this->belongsTo(GenerationJob::class, 'generation_job_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
