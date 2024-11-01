<?php

declare(strict_types=1);

namespace App\Http\Requests\UserCall;

use Illuminate\Foundation\Http\FormRequest;

final class IceCandidateRequest extends FormRequest
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
            'candidate' => ['required'],
        ];
    }
}
