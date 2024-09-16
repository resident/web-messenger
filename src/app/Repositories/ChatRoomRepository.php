<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;

final class ChatRoomRepository
{
    public function createChatRoom(ChatRoomDto $chatRoomDto): ChatRoom
    {
        return ChatRoom::create($chatRoomDto->toArray());
    }
}
