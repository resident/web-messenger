<?php

declare(strict_types=1);

namespace App\Services;

use App\Dto\ChatRoomDto;
use App\Enums\ChatRoomPermissionEnum;
use App\Models\ChatRoom;
use App\Models\User;
use App\Repositories\ChatRoomRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Enums\ChatRoomRoleEnum;

final readonly class ChatRoomService
{
    public function __construct(
        public ChatRoomRepository $repository,
    ) {}

    /**
     * @param ChatRoomDto $chatRoomDto
     * @param array $usersWithKeys
     * @param int $creatorId
     * @return ChatRoom
     */
    public function createChatRoom(ChatRoomDto $chatRoomDto, array $usersWithKeys, int $creatorId): ChatRoom
    {
        return DB::transaction(function () use ($chatRoomDto, $usersWithKeys, $creatorId) {
            $chatRoom = $this->repository->createChatRoom($chatRoomDto);

            $isTwoUsers = count($usersWithKeys) === 2;
            $usersWithRoles = collect($usersWithKeys)->mapWithKeys(function ($attributes, $userId) use ($creatorId, $isTwoUsers) {
                if ($isTwoUsers) {
                    return [
                        $userId => array_merge($attributes, [
                            'role_name' => ChatRoomRoleEnum::OWNER->value,
                            'permissions' => ChatRoomPermissionEnum::values(),
                        ]),
                    ];
                }

                if ($userId == $creatorId) {
                    return [
                        $userId => array_merge($attributes, [
                            'role_name' => ChatRoomRoleEnum::OWNER->value,
                            'permissions' => ChatRoomPermissionEnum::values(),
                        ]),
                    ];
                }

                return [
                    $userId => array_merge($attributes, [
                        'role_name' => ChatRoomRoleEnum::MEMBER->value,
                        'permissions' => [],
                    ]),
                ];
            })->toArray();

            $chatRoom->users()->sync($usersWithRoles);

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

    public function addUser(ChatRoom $chatRoom, User $user, string $chatRoomKey)
    {
        $chatRoom->users()->attach($user->id, [
            'chat_room_key' => $chatRoomKey,
            'role_name' => ChatRoomRoleEnum::MEMBER->value,
            'permissions' => [],
        ]);
    }

    public function updateUserRole(ChatRoom $chatRoom, User $user, string $roleName, array $permissions)
    {
        $chatRoom->users()->updateExistingPivot($user->id, [
            'role_name' => $roleName,
            'permissions' => $permissions,
        ]);
    }
}
