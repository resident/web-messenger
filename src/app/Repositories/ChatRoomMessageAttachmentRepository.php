<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomMessageAttachmentDto;
use App\Models\ChatRoomMessageAttachment;

final class ChatRoomMessageAttachmentRepository
{
    public function createAttachment(ChatRoomMessageAttachmentDto $attachmentDto): ChatRoomMessageAttachment
    {
        return ChatRoomMessageAttachment::unguarded(
            fn() => ChatRoomMessageAttachment::query()->create($attachmentDto->toArray())
        );
    }
}
