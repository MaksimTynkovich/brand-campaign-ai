<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Template extends Model
{
    protected $fillable = [
        'category',
        'description',
        'preview_url',
        'example_video_path',
        'original_prompt',
        'reference_images',
        'default_voiceover',
        'sort_order',
    ];

    protected $appends = ['example_video_url'];

    protected function casts(): array
    {
        return [
            'reference_images' => 'array',
        ];
    }

    public function getPreviewUrlAttribute(?string $value): ?string
    {
        if (empty($value)) {
            return null;
        }
        if (str_starts_with($value, 'http')) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }

    public function getExampleVideoUrlAttribute(): ?string
    {
        $value = $this->getRawOriginal('example_video_path');
        if (empty($value)) {
            return null;
        }
        if (is_string($value) && str_starts_with($value, 'http')) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }
}
