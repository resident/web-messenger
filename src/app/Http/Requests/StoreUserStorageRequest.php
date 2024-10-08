<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\UserStorage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreUserStorageRequest extends FormRequest
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
            'key' => [
                'bail',
                'required',
                'string',
                'min:1',
                'max:255',
                Rule::unique(UserStorage::class, 'key')->where('user_id', request()->user()->id()),
            ],
            'value' => ['required'],
        ];
    }
}
