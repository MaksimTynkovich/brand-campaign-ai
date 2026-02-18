<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTemplateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('templateCategory')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:64',
                Rule::unique('template_categories', 'name')->ignore($id),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

