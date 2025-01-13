<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\Concerns\ToArray;
use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use App\Events\UserOnlineStatusChanged;
use App\Http\Requests\UpdateUserSettingsRequest;
use App\Repositories\UserSettingsRepository;
use App\Services\ProfileService;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Http\JsonResponse;

final class UserSettingsController extends Controller
{
    /**
     * Display the specified resource.
     */
    public function get(UserSettingsRepository $repository): JsonResponse
    {
        $user = request()->user();

        return response()->json($repository->getUserSettingsByUserId($user->id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateUserSettingsRequest $request,
        UserSettingsRepository $repository,
        ProfileService $profileService
    ): JsonResponse {
        $user = request()->user();
        $settings = $request->validated();
        $result = $repository->updateUserSettings($user->id, $settings);

        if (array_key_exists('status_visibility', $settings)) {
            $newVisibility = $settings['status_visibility'];

            switch ($newVisibility) {
                case VisibilityPrivacyEnum::EVERYONE->value:
                    $userStatus = $profileService->getUserStatus($user, $user->id);

                    if ($userStatus) {
                        broadcast(new UserOnlineStatusChanged($userStatus));
                    }
                    break;
                case VisibilityPrivacyEnum::CONTACTS->value:
                    $allChatUserIds = $user
                        ->chatRooms()
                        ->with('users:id')
                        ->get()
                        ->pluck('users.*.id')
                        ->flatten()
                        ->unique()
                        ->values()
                        ->all();

                    $contactUserIds = $user->contacts()->pluck('users.id')->toArray();
                    $nonContactUserIds = array_diff($allChatUserIds, $contactUserIds);
                    $realUserStatus = $profileService->getUserStatus($user, $user->id)
                        ?? new UserStatusDto($user->id, false, null);

                    $offlineUserStatus = new UserStatusDto($user->id, false, null);

                    if (!empty($contactUserIds)) {
                        broadcast(new UserOnlineStatusChanged($realUserStatus));
                    }

                    if (!empty($nonContactUserIds)) {
                        $channels = array_map(fn($id) => new PrivateChannel("chat-rooms.$id"), $nonContactUserIds);
                        broadcast(new UserOnlineStatusChanged($offlineUserStatus, $channels));
                    }
                    break;
                case VisibilityPrivacyEnum::NOBODY->value:
                    $chatRoomIds = $user->chatRooms()->pluck('chat_rooms.id')->toArray();

                    $offlineUserStatus = new UserStatusDto($user->id, false, null);

                    if (!empty($chatRoomIds)) {
                        $channels = array_map(fn($id) => new PrivateChannel("chat-room.$id"), $chatRoomIds);
                        broadcast(new UserOnlineStatusChanged($offlineUserStatus, $channels));
                    }
                    break;
            }
        }

        return response()->json($result);
    }
}
