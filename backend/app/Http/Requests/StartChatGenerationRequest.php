<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartChatGenerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'session_id' => ['required', 'integer', 'exists:chat_sessions,id'],
            'message_id' => ['nullable', 'integer', 'exists:chat_messages,id'],
        ];
    }
}
