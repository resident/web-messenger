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

    /**
     * @param ChatRoom $chatRoom
     * @param array<string, string> $values
     * @return bool
     */
    public function updateChatRoom(ChatRoom $chatRoom, array $values): bool
    {
        return $chatRoom->update($values);
    }
}
