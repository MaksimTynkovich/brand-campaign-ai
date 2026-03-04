<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GenerationJob extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'template_id',
        'status',
        'user_prompt',
        'merged_prompt',
        'video_path',
        'original_video_path',
        'watermarked_video_path',
        'error_message',
        'input',
    ];

    protected function casts(): array
    {
        return [
            'input' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }
}
