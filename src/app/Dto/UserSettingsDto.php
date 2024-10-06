<?php

declare(strict_types=1);

namespace App\Dto;

use App\Dto\Concerns\FromArray;
use App\Dto\Concerns\ToArray;

final class UserSettingsDto
{
    use FromArray;
    use ToArray;

    public function __construct(
        public ?int $id,
        public int $user_id,
        public string $status_visibility,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}
}
