<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class ChatRoomDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?string $id,
        public string $title,
        public ?string $createdAt,
        public ?string $updatedAt
    ) {
    }
}
