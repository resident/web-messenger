<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class ForwardChatRoomMessageRequest extends FormRequest
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
            'message' => 'required|string',
            'messageIv' => 'required|string',
            'messageKey' => 'required|string',
            'messageKeyIv' => 'required|string',
            'attachments' => 'sometimes|array',
            'attachments.*.id' => 'required_with:attachments|uuid',
            'attachments.*.attachmentKey' => 'required_with:attachments|string',
            'attachments.*.attachmentKeyIv' => 'required_with:attachments|string',
        ];
    }
}
