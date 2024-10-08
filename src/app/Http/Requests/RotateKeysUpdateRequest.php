<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RotateKeysUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'public_key' => 'bail|required|string',
            'keys' => 'required|array|min:1',
            'keys.*.chat_room_id' => 'required|uuid',
            'keys.*.chat_room_key' => 'required|string|min:1|max:2048',
        ];
    }
}
