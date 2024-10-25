<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomDto;
use App\Events\ChatRoomCreated;
use App\Events\ChatRoomUpdated;
use App\Http\Requests\StoreChatRoomRequest;
use App\Http\Requests\UpdateChatRoomRequest;
use App\Models\ChatRoom;
use App\Repositories\ChatRoomRepository;
use App\Services\ChatRoomService;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Response as InertiaResponse;

class ChatRoomsController extends Controller
{
    public function list(ChatRoomRepository $repository): JsonResponse
    {
        $chatRooms = $repository->getUserChatRoomsDesc(request()->user());

        return response()->json($chatRooms);
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
     * Display the specified resource.
     */
    public function show(string $chatRoomId, ProfileService $profileService)
    {
        $user = request()->user();
        $chatRoom = $user->chatRooms()->with('users')->where('chat_room_id', $chatRoomId)->first();
        if (!$chatRoom) {
            abort(404);
        }
        $userIds = $chatRoom->users->pluck('id')->values()->all();
        $statuses = $profileService->getUsersStatus($user, $userIds);
        $chatRoom->users = $chatRoom->users->map(function ($chatUser) use ($statuses) {
            $status = $statuses[$chatUser->id] ?? null;
            $chatUser->is_online = $status?->is_online ?? false;
            $chatUser->last_seen_at = $status?->last_seen_at;
            return $chatUser;
        });
        return inertia('ChatRoom/Show', ['chatRoom' => $chatRoom]);
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
        return response()->json($service->deleteChatRoom($chatRoom));
    }
}
