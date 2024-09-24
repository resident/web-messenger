<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class ChatRoomUserDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?int $id,
        public string $chatRoomId,
        public int $userId,
        public string $chatRoomKey,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }

}
