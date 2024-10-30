<?php

declare(strict_types=1);

namespace App\Http\Requests\UserCall;

use App\Enums\MediaTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class SdpDescriptionRequest extends FormRequest
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
            'media_type' => ['required', Rule::enum(MediaTypeEnum::class)],
            'description' => ['required', 'array'],
            'description.sdp' => ['required', 'string'],
            'description.type' => ['required', 'string'],
        ];
    }
}
