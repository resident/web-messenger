<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class UserStatusDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public int $user_id,
        public bool $is_online,
        public ?string $last_seen_at,
    ) {}
}
