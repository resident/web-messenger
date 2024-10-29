<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class AvatarRequest extends FormRequest
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
            'avatar' => 'required|file|mimes:jpg,jpeg,png,gif|max:2048',
        ];
    }

    public function messages()
    {
        return [
            'avatar.required' => 'An avatar file is required.',
            'avatar.file' => 'The uploaded file must be a valid file.',
            'avatar.mimes' => 'The avatar must be a file of type: jpg, jpeg, png, gif.',
            'avatar.max' => 'The avatar may not be greater than 2MB.',
        ];
    }
}
