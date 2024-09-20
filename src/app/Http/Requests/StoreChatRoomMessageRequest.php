<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreChatRoomMessageRequest extends FormRequest
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
            'attachments.*.name' => 'required_with:attachments|string',
            'attachments.*.mimeType' => 'required_with:attachments|string',
            'attachments.*.size' => 'required_with:attachments|integer',
            'attachments.*.attachment' => 'required_with:attachments|file',
            'attachments.*.attachmentIv' => 'required_with:attachments|string',
            'attachments.*.attachmentKey' => 'required_with:attachments|string',
            'attachments.*.attachmentKeyIv' => 'required_with:attachments|string',
        ];
    }
}
