<?php

declare(strict_types=1);

namespace App\Services;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;
use App\Repositories\ChatRoomRepository;
use Illuminate\Support\Facades\DB;

final readonly class ChatRoomService
{
    public function __construct(
        public ChatRoomRepository $repository,
    ) {
    }

    /**
     * @param ChatRoomDto $chatRoomDto
     * @param array $usersWithKeys
     * @return ChatRoom
     */
    public function createChatRoom(ChatRoomDto $chatRoomDto, array $usersWithKeys): ChatRoom
    {
        return DB::transaction(function () use ($chatRoomDto, $usersWithKeys) {
            $chatRoom = $this->repository->createChatRoom($chatRoomDto);

            $chatRoom->users()->sync($usersWithKeys);

            return $chatRoom;
        });
    }
}
