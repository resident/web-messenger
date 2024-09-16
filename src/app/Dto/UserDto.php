<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class UserDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?int $id,
        public string $name,
        public string $email,
        public ?string $emailVerifiedAt,
        public string $password,
        public string $publicKey,
        public ?string $rememberToken,
        public ?string $createdAt,
        public ?string $updatedAt,
    ) {
    }
}
