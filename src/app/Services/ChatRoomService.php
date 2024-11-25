<?php

declare(strict_types=1);

namespace App\Services;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;
use App\Models\User;
use App\Repositories\ChatRoomRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

    public function deleteChatRoom(ChatRoom $chatRoom): ?bool
    {
        $refsDiff = $this->repository->getAttachmentRefsDiff($chatRoom);

        foreach ($refsDiff as $path => $count) {
            if ($count == 0) {
                Storage::delete($path);
            }
        }

        return $this->repository->deleteChatRoom($chatRoom);
    }

    public function deleteUser(ChatRoom $chatRoom, User $user): ?bool
    {
        if ($chatRoom->users()->count() > 1) {
            return (bool)$chatRoom->users()->detach($user);
        } else {
            return $this->deleteChatRoom($chatRoom);
        }
    }
}
