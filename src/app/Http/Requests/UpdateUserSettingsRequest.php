<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\VisibilityPrivacyEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateUserSettingsRequest extends FormRequest
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
            'status_visibility' => ['sometimes', Rule::enum(VisibilityPrivacyEnum::class)],
            'safe_view_is_on' => ['sometimes', 'boolean'],
        ];
    }
}
