<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin ?? false;
    }

    public function rules(): array
    {
        return [
            'category' => ['nullable', 'string', 'max:64', 'exists:template_categories,name'],
            'description' => ['nullable', 'string', 'max:2000'],
            'preview' => ['nullable', 'image', 'max:5120'],
            'example_video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:51200'],
            'reference_images' => ['nullable', 'array', 'max:2'],
            'reference_images.*' => ['image', 'max:5120'],
            'original_prompt' => ['required', 'string', 'max:10000'],
            'default_voiceover' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

}
