<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class ChatRoomRepository
{
    public function createChatRoom(ChatRoomDto $chatRoomDto): ChatRoom
    {
        return ChatRoom::create($chatRoomDto->toArray());
    }

    /**
     * @param User $user
     * @return Collection<int, ChatRoom>
     */
    public function getUserChatRoomsDesc(User $user): Collection
    {
        return $user->chatRooms()->with('users')->orderByDesc('id')->get();
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
