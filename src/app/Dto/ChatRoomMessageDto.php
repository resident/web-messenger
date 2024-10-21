<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class ChatRoomMessageDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?string $id,
        public ?string $chatRoomId,
        public int $userId,
        public int $originalUserId,
        public string $message,
        public string $messageIv,
        public string $messageKey,
        public string $messageKeyIv,
        public ?string $createdAt,
        public ?string $updatedAt
    ) {
    }
}
