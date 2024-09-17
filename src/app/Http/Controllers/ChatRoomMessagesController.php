<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomMessageDto;
use App\Events\ChatRoomMessageRemoved;
use App\Events\ChatRoomMessageSent;
use App\Http\Requests\StoreChatRoomMessageRequest;
use App\Http\Requests\UpdateChatRoomMessageRequest;
use App\Models\ChatRoom;
use App\Models\ChatRoomMessage;
use App\Repositories\ChatRoomMessageRepository;
use Illuminate\Http\JsonResponse;

class ChatRoomMessagesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(
        ChatRoomMessageRepository $chatRoomMessageRepository,
        ChatRoom $chatRoom,
        int $count = 10,
        ?string $startId = null,
    ) {
        $messages = $chatRoomMessageRepository->getMessages($chatRoom->id, $count, $startId);

        return response()->json($messages);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(
        ChatRoom $chatRoom,
        StoreChatRoomMessageRequest $request,
        ChatRoomMessageRepository $chatRoomMessageRepository
    ) {
        $data = [
            ...$request->safe(),
            'user_id' => $request->user()->id,
            'chat_room_id' => $chatRoom->id,
        ];

        $message = $chatRoomMessageRepository->createMessage(ChatRoomMessageDto::fromArray($data));

        $message->load('user');

        broadcast(new ChatRoomMessageSent($message))->toOthers();

        return response()->json($message);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateChatRoomMessageRequest $request, ChatRoomMessage $chatRoomMessage)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(
        ChatRoom $chatRoom,
        ChatRoomMessage $message,
        ChatRoomMessageRepository $chatRoomMessageRepository
    ): JsonResponse {
        $messageDto = ChatRoomMessageDto::fromArray($message->toArray());

        $isDeleted = $chatRoomMessageRepository->deleteMessage($message);

        if ($isDeleted) {
            broadcast(new ChatRoomMessageRemoved($messageDto))->toOthers();
        }
        return response()->json(compact('isDeleted'));
    }
}
