<?php

namespace App\Enums;

enum ChatRoomRoleEnum: string
{
    case OWNER = 'owner';
    case ADMIN = 'admin';
    case MODERATOR = 'moderator';
    case MEMBER = 'member';
}
