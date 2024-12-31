<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;
use App\Enums\ChatRoomPermissionEnum;
use App\Enums\ChatRoomRoleEnum;

class ChatRoomUser extends Pivot
{
    use HasUuids;

    protected $casts = [
        'permissions' => 'array',
    ];

    public function can($permission): bool
    {
        if ($this->role_name === ChatRoomRoleEnum::OWNER->value) return true;

        return in_array($permission, $this->permissions ?? [], true);
    }

    public function isAdmin(): bool
    {
        if ($this->role_name === ChatRoomRoleEnum::OWNER->value) return false;

        return $this->can(ChatRoomPermissionEnum::CHANGE_ROLES_OF_OTHERS->value);
    }

    public function isModerator(): bool
    {
        if ($this->role_name === ChatRoomRoleEnum::OWNER->value) return false;
        if ($this->isAdmin()) return false;

        return !empty($this->permissions);
    }
}
