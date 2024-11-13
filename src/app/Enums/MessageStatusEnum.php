<?php

namespace App\Enums;

enum MessageStatusEnum: string
{
    case SENT = 'SENT';
        //case DELIVERED = 'DELIVERED';
    case SEEN = 'SEEN';
}
