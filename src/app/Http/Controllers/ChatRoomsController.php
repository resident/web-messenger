<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomDto;
use App\Events\ChatRoomAdded;
use App\Events\ChatRoomCreated;
use App\Events\UserChatRoomUnreadCountUpdated;
use App\Events\ChatRoomUpdated;
use App\Http\Requests\StoreChatRoomRequest;
use App\Http\Requests\UpdateChatRoomRequest;
use App\Models\ChatRoom;
use App\Repositories\ChatRoomRepository;
use App\Services\ChatRoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Log;
use App\Enums\ChatRoomPermissionEnum;
use App\Enums\ChatRoomRoleEnum;
use App\Models\User;
use App\Services\ProfileService;

class ChatRoomsController extends Controller
{
    public function list(ChatRoomRepository $repository): JsonResponse
    {
        $chatRooms = $repository->getUserChatRoomsDesc(request()->user());

        return response()->json($chatRooms);
    }

    public function getChatRoom(Request $request, ChatRoom $chatRoom, ChatRoomRepository $crRepository, ProfileService $profileService)
    {
        $chatRoom = $this->getChatRoomWithStatus($request->user(), $chatRoom, $crRepository, $profileService);
        return response()->json($chatRoom);
    }

    private function getChatRoomWithStatus(User $user, ChatRoom $chatRoom, ChatRoomRepository $crRepository, ProfileService $profileService)
    {
        $chatRoom = $crRepository->getChatRoom($chatRoom, $user);

        if ($chatRoom->users->count() === 2) {
            $otherUser = $chatRoom->users->firstWhere('id', '!=', $user->id);
            if ($otherUser) {
                $status = $profileService->getUserStatus($user, $otherUser->id);
                if ($status) {
                    $otherUser->is_online = $status->is_online;
                    $otherUser->last_seen_at = $status->last_seen_at;
                }
            }
        }

        return $chatRoom;
    }

    public function updateLastReadAt(Request $request, ChatRoom $chatRoom, ChatRoomRepository $repository)
    {
        $user = $request->user();
        $newLastReadAt = $request->input('last_read_at');

        /*Log::info('Updating last_read_at', [
            'userId' => $user->id,
            'chatRoomId' => $chatRoom->id,
            'newLastReadAt' => $newLastReadAt,
        ]);*/

        $repository->updateLastReadAt($user, $chatRoom, $newLastReadAt);
        $unreadCount = $repository->getUnreadCount($chatRoom, $newLastReadAt, $user);

        /*Log::info('Unread count after updating last_read_at', [
            'chatRoomId' => $chatRoom->id,
            'unreadCount' => $unreadCount,
        ]);*/

        broadcast(new UserChatRoomUnreadCountUpdated($chatRoom->id, $unreadCount, $newLastReadAt, $user->id))->toOthers();

        return response()->json(['status' => 'success']);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): InertiaResponse
    {
        return inertia('ChatRoom/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(
        StoreChatRoomRequest $request,
        ChatRoomService $chatRoomService,
        ChatRoomRepository $crRepository,
        ProfileService $profileService
    ) {
        $user = $request->user();
        $chatRoomDto = ChatRoomDto::fromArray($request->safe(['title']));

        $usersWithChatRoomKey = collect($request->validated('users'))->mapWithKeys(function ($u) {
            return [$u['id'] => ['chat_room_key' => $u['chat_room_key']]];
        })->toArray();

        $creatorId = $user->id;

        $chatRoom = $chatRoomService->createChatRoom($chatRoomDto, $usersWithChatRoomKey, $creatorId);
        $chatRoom = $this->getChatRoomWithStatus($user, $chatRoom, $crRepository, $profileService);
        broadcast(new ChatRoomCreated($chatRoom))->toOthers();

        $shouldRedirect = $request->boolean('shouldRedirect', true);
        if ($shouldRedirect) {
            return response()->redirectToRoute('main', [$chatRoom->id]);
        } else {
            return response()->json($chatRoom);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ChatRoom $chatRoom)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(
        UpdateChatRoomRequest $request,
        ChatRoom $chatRoom,
        ChatRoomService $chatRoomService
    ): JsonResponse {
        $user = $request->user();
        $pivot = $chatRoom->users()->where('user_id', $user->id)->first()?->pivot;
        if (!$pivot) {
            abort(403, 'Access denied');
        }
        $validatedData = $request->validated();
        $updateData = [];

        if (array_key_exists('title', $validatedData)) {
            if ($pivot->can(ChatRoomPermissionEnum::CHANGE_CHAT_INFO->value)) {
                $updateData['title'] = $validatedData['title'];
            }
        }

        if (array_key_exists('auto_remove_timeout', $validatedData)) {
            if ($pivot->can(ChatRoomPermissionEnum::SET_AUTO_REMOVE_TIMEOUT->value)) {
                $updateData['auto_remove_timeout'] = $validatedData['auto_remove_timeout'];
            }
        }

        if (empty($updateData)) {
            return response()->json(['message' => 'Nothing changed']);
        }


        $chatRoomService->repository->updateChatRoom($chatRoom, $updateData) or abort(
            500,
            'Unable to update chat room'
        );

        $updatedChatRoom = $chatRoom->refresh()->load('users');

        $changes = $updateData;

        broadcast(new ChatRoomUpdated($updatedChatRoom, $changes))->toOthers();

        return response()->json($updatedChatRoom);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ChatRoom $chatRoom, ChatRoomService $service): JsonResponse
    {
        $user = request()->user();
        $pivot = $chatRoom->users()->where('user_id', $user->id)->first()?->pivot;
        if (!$pivot) {
            abort(403, 'Access denied');
        }

        if ($pivot->role_name === ChatRoomRoleEnum::OWNER->value) {
            $service->deleteChatRoom($chatRoom);
            broadcast(new ChatRoomUpdated($chatRoom, ['is_deleted' => true]))->toOthers();
        } else {
            $service->deleteUser($chatRoom, $user);
            $deletedUser = [
                'id' => $user->id,
            ];
            $changes = ['deleted_user' => $deletedUser];
            broadcast(new ChatRoomUpdated($chatRoom, $changes))->toOthers();
        }
        return response()->json(['status' => 'success']);
    }

    public function updateUserRoleAndPermissions(Request $request, ChatRoom $chatRoom, User $userToUpdate, ChatRoomService $chatRoomService)
    {
        $user = $request->user();
        $pivot = $chatRoom->users()->where('user_id', $user->id)->first()?->pivot;
        // 1
        if (!$pivot) {
            abort(403, 'Access denied');
        }
        if ($pivot->role_name !== ChatRoomRoleEnum::OWNER->value && !$pivot->can(ChatRoomPermissionEnum::CHANGE_ROLES_OF_OTHERS->value)) {
            abort(403, 'Access denied');
        }

        // 2
        $data = $request->validate([
            'permissions' => 'array',
        ]);

        // 3
        $targetPivot = $chatRoom->users()->where('user_id', $userToUpdate->id)->first()?->pivot;
        if (!$targetPivot) {
            abort(404, 'User not in chat');
        }
        if (
            $targetPivot->role_name === ChatRoomRoleEnum::OWNER->value
            && ($pivot->role_name !== ChatRoomRoleEnum::OWNER->value || $userToUpdate->id === $user->id)
        ) {
            abort(403, 'Access denied');
        }

        // 4
        $permissions = $data['permissions'];
        $roleName = ChatRoomRoleEnum::MEMBER->value;
        if (!empty($permissions)) {
            $roleName = in_array(ChatRoomPermissionEnum::CHANGE_ROLES_OF_OTHERS->value, $permissions)
                ? ChatRoomRoleEnum::ADMIN->value
                : ChatRoomRoleEnum::MODERATOR->value;
        }

        $chatRoomService->updateUserRole($chatRoom, $userToUpdate, $roleName, $permissions);

        $updatedUser = [
            'id' => $userToUpdate->id,
            'role_name' => $roleName,
            'permissions' => $permissions,
        ];
        $changes = [
            'updated_user' => $updatedUser,
        ];
        broadcast(new ChatRoomUpdated($chatRoom, $changes))->toOthers();

        return response()->json([
            'id' => $chatRoom->id,
            'updated_user' => $updatedUser,
        ]);
    }

    public function addUser(
        Request $request,
        ChatRoom $chatRoom,
        User $userToAdd,
        ChatRoomService $chatRoomService,
        ChatRoomRepository $crRepository,
        ProfileService $profileService
    ): JsonResponse {
        $currentUser = $request->user();

        $currentPivot = $chatRoom->users()
            ->where('user_id', $currentUser->id)
            ->first()?->pivot;

        if (
            !$currentPivot ||
            ($currentPivot->role_name !== ChatRoomRoleEnum::OWNER->value
                && !$currentPivot->can(ChatRoomPermissionEnum::ADD_REMOVE_USERS->value))
        ) {
            abort(403, 'Access denied');
        }

        $data = $request->validate([
            'chat_room_key' => 'required|string',
        ]);

        $existingPivot = $chatRoom->users()->where('user_id', $userToAdd->id)->first();
        if ($existingPivot) {
            abort(409, 'User already in chat');
        }

        $updatedUser = null;

        DB::transaction(function () use (&$updatedUser, $chatRoom, $userToAdd, $currentUser, $chatRoomService, $data) {
            $count = $chatRoom->users()->wherePivot('role_name', ChatRoomRoleEnum::OWNER->value)->count();
            if ($count === 2) {
                $allUsers = $chatRoom->users()->get();
                [$owner, $member] = $allUsers->partition(fn($user) => $user->id === $currentUser->id);

                $chatRoom->users()->updateExistingPivot($owner->first()->id, [
                    'role_name' => ChatRoomRoleEnum::OWNER->value,
                    'permissions' => ChatRoomPermissionEnum::values(),
                ]);
                $chatRoom->users()->updateExistingPivot($member->first()->id, [
                    'role_name' => ChatRoomRoleEnum::MEMBER->value,
                    'permissions' => [],
                ]);
                $updatedUser = [
                    'id' => $member->first()->id,
                    'role_name' => ChatRoomRoleEnum::MEMBER->value,
                    'permissions' => [],
                ];
            }

            $chatRoomService->addUser($chatRoom, $userToAdd, $data['chat_room_key']);
        });

        $chatRoom = $this->getChatRoomWithStatus($currentUser, $chatRoom, $crRepository, $profileService);
        $userToAddWithPivot = $chatRoom->users()
            ->where('users.id', $userToAdd->id)
            ->with('avatar')
            ->first();
        $userStatus = $profileService->getUserStatus($currentUser, $userToAdd->id);
        $userToAddWithPivot->is_online = $userStatus?->is_online ?? false;
        $userToAddWithPivot->last_seen_at = $userStatus?->last_seen_at;

        $changes = ['added_user' => $userToAddWithPivot];
        $response = [
            'id' => $chatRoom->id,
            'added_user' => $userToAddWithPivot,
        ];

        if ($updatedUser !== null) {
            $changes['updated_user'] = $updatedUser;
            $response['updated_user'] = $updatedUser;
        }

        broadcast(new ChatRoomUpdated($chatRoom, $changes))->toOthers();
        broadcast(new ChatRoomAdded($chatRoom, $userToAddWithPivot->id))->toOthers();

        return response()->json($response);
    }

    public function removeUser(Request $request, ChatRoom $chatRoom, User $userToRemove, ChatRoomService $chatRoomService): JsonResponse
    {
        $currentUser = $request->user();
        $currentPivot = $chatRoom->users()
            ->where('user_id', $currentUser->id)
            ->first()?->pivot;

        if (
            !$currentPivot ||
            ($currentPivot->role_name !== ChatRoomRoleEnum::OWNER->value
                && !$currentPivot->can(ChatRoomPermissionEnum::ADD_REMOVE_USERS->value))
        ) {
            abort(403, 'Access denied');
        }

        $targetPivot = $chatRoom->users()->where('user_id', $userToRemove->id)->first()?->pivot;
        if (!$targetPivot || $targetPivot->role_name === ChatRoomRoleEnum::OWNER->value) {
            abort(403, 'Access denied');
        }

        $chatRoomService->deleteUser($chatRoom, $userToRemove);

        $deletedUser = [
            'id' => $userToRemove->id,
        ];
        $changes = ['deleted_user' => $deletedUser];

        broadcast(new ChatRoomUpdated($chatRoom, $changes))->toOthers();

        return response()->json([
            'id' => $chatRoom->id,
            'deleted_user' => $deletedUser,
        ]);
    }
}
