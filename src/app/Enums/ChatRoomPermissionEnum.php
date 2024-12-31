<?php

namespace App\Enums;

enum ChatRoomPermissionEnum: string
{
    case CHANGE_ROLES_OF_OTHERS = 'change_roles_of_others';
    case DELETE_MESSAGES_OF_OTHERS = 'delete_messages_of_others';
    case CHANGE_CHAT_INFO = 'change_chat_info';
    case ADD_REMOVE_USERS = 'add_remove_users';
    case SET_AUTO_REMOVE_TIMEOUT = 'set_auto_remove_timeout';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
