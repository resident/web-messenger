<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class ProfileDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?int $id,
        public int $user_id,
        public ?string $last_seen_at,
        public bool $is_online,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}
}
