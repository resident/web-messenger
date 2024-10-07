<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class UserStorageDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?string $id,
        public int $user_id,
        public string $key,
        public mixed $value,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
        //
    }
}
