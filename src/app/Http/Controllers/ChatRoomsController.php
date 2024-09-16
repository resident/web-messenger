<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomDto;
use App\Http\Requests\StoreChatRoomRequest;
use App\Http\Requests\UpdateChatRoomRequest;
use App\Models\ChatRoom;
use App\Services\ChatRoomService;
use Illuminate\Http\RedirectResponse;

class ChatRoomsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): \Inertia\Response
    {
        $user = request()->user();
        $chatRooms = $user->chatRooms()->orderByDesc('id')->get();

        return inertia('ChatRoom/List', compact('chatRooms'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
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

        return response()->redirectToRoute('chat_rooms.show', [$chatRoom->id]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $chatRoomId)
    {
        $chatRoom = request()->user()->chatRooms()->where('chat_room_id', $chatRoomId)->first();

        if (!$chatRoom) {
            abort(404);
        }

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
    public function update(UpdateChatRoomRequest $request, ChatRoom $chatRoom)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ChatRoom $chatRoom)
    {
        //
    }
}
