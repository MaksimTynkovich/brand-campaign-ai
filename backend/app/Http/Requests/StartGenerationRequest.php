<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartGenerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'prompt' => ['nullable', 'string', 'max:5000'],
            'images' => ['nullable', 'array', 'max:2'],
            'images.*' => ['image', 'max:10240'],
        ];
    }
}
