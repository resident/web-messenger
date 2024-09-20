<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class ChatRoomMessageAttachmentDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?string $id,
        public ?string $chatRoomMessageId,
        public string $path,
        public string $name,
        public string $mimeType,
        public int $size,
        public string $attachmentIv,
        public string $attachmentKey,
        public string $attachmentKeyIv,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }
}
