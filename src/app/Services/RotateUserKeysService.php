<?php

declare(strict_types=1);

namespace App\Services;

use App\Dto\ChatRoomUserDto;
use App\Models\ChatRoomUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class RotateUserKeysService
{
    /**
     * @param User $user
     * @param string $publicKey
     * @param array<int, ChatRoomUserDto> $chatRoomUserDTOs
     * @return int
     */
    public function rotate(User $user, string $publicKey, array $chatRoomUserDTOs): int
    {
        return DB::transaction(function () use ($user, $publicKey, $chatRoomUserDTOs) {
            $user->update(['public_key' => $publicKey]);

            $updated = 0;

            foreach ($chatRoomUserDTOs as $chatRoomUserDto) {
                $updated += ChatRoomUser::query()
                    ->where('chat_room_id', $chatRoomUserDto->chatRoomId)
                    ->where('user_id', $user->id)
                    ->update([
                        'chat_room_key' => $chatRoomUserDto->chatRoomKey,
                    ]);
            }

            return $updated;
        });
    }
}
