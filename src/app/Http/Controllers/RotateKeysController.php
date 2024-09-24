<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomUserDto;
use App\Http\Requests\RotateKeysUpdateRequest;
use App\Repositories\ChatRoomRepository;
use App\Services\RotateUserKeysService;
use Illuminate\Http\JsonResponse;

final class RotateKeysController extends Controller
{
    public function update(
        RotateKeysUpdateRequest $request,
        RotateUserKeysService $service,
        ChatRoomRepository $chatRoomRepository
    ): JsonResponse {
        $user = request()->user();
        $publicKey = $request->validated('public_key');
        $keys = $request->validated('keys');

        $chatRoomUserDTOs = [];

        foreach ($keys as $key) {
            $chatRoomUserDTOs[] = ChatRoomUserDto::fromArray(['user_id' => $user->id, ...$key,]);
        }

        $updated = $service->rotate($user, $publicKey, $chatRoomUserDTOs);
        $chatRooms = $chatRoomRepository->getUserChatRoomsDesc($user);

        return response()->json(compact('updated', 'chatRooms'));
    }
}
