<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomDto;
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

class ChatRoomsController extends Controller
{
    public function list(ChatRoomRepository $repository): JsonResponse
    {
        $chatRooms = $repository->getUserChatRoomsDesc(request()->user());

        return response()->json($chatRooms);
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
        ChatRoomService $chatRoomService
    ): RedirectResponse {
        $chatRoomDto = ChatRoomDto::fromArray($request->safe(['title']));

        $usersWithChatRoomKey = collect($request->validated('users'))->mapWithKeys(function ($u) {
            return [$u['id'] => ['chat_room_key' => $u['chat_room_key']]];
        })->toArray();

        $chatRoom = $chatRoomService->createChatRoom($chatRoomDto, $usersWithChatRoomKey);

        broadcast(new ChatRoomCreated($chatRoom))->toOthers();

        return response()->redirectToRoute('main', [$chatRoom->id]);
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
        $chatRoomService->repository->updateChatRoom($chatRoom, $request->validated()) or abort(
            500,
            'Unable to update chat room'
        );

        broadcast(new ChatRoomUpdated($chatRoom))->toOthers();

        return response()->json($chatRoom);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ChatRoom $chatRoom, ChatRoomService $service): JsonResponse
    {
        return response()->json($service->deleteUser($chatRoom, request()->user()));
    }
}
