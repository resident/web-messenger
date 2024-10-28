<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\ChatRoomMessageAttachmentDto;
use App\Dto\ChatRoomMessageDto;
use App\Events\ChatRoomMessageRemoved;
use App\Events\ChatRoomMessageSent;
use App\Http\Requests\ForwardChatRoomMessageRequest;
use App\Http\Requests\StoreChatRoomMessageRequest;
use App\Http\Requests\UpdateChatRoomMessageRequest;
use App\Models\ChatRoom;
use App\Models\ChatRoomMessage;
use App\Models\ChatRoomMessageAttachment;
use App\Repositories\ChatRoomMessageRepository;
use App\Services\ChatRoomMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        ChatRoomMessageService $messageService,
    ): JsonResponse {
        $messageDto = ChatRoomMessageDto::fromArray([
            'user_id' => $request->user()->id,
            'original_user_id' => $request->user()->id,
            'chat_room_id' => $chatRoom->id,
            ...$request->safe(['message', 'messageIv', 'messageKey', 'messageKeyIv']),
        ]);

        $attachments = $request->validated(['attachments'], []);

        $attachmentsDto = [];

        foreach ($attachments as $attachment) {
            $file = $attachment['attachment'];

            $filePath = $file->store("attachments/{$request->user()->id}");

            $attachmentsDto[] = ChatRoomMessageAttachmentDto::fromArray([
                'path' => $filePath,
                ...$attachment,
                'size' => (int)$attachment['size'],
            ]);
        }

        $message = $messageService->createMessageWithAttachments($messageDto, $attachmentsDto);

        $message->load(['user.avatar', 'attachments']);

        broadcast(new ChatRoomMessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function forward(
        ChatRoom $chatRoom,
        ChatRoomMessage $message,
        ForwardChatRoomMessageRequest $request,
        ChatRoomMessageService $messageService,
    ): JsonResponse {
        $messageDto = ChatRoomMessageDto::fromArray([
            'user_id' => $request->user()->id,
            'original_user_id' => $message->original_user_id,
            'chat_room_id' => $chatRoom->id,
            ...$request->safe(['message', 'messageIv', 'messageKey', 'messageKeyIv']),
        ]);

        $attachments = collect($request->validated(['attachments'], []));

        $message->load('attachments');

        $attachmentsDto = [];

        foreach ($message->attachments as $attachment) {
            $attachmentDto = ChatRoomMessageAttachmentDto::fromArray(
                collect([
                    ...collect($attachment)->except(['attachment_key', 'attachment_key_iv']),
                    ...$attachments->where('id', $attachment->id)->collapse()->only([
                        'attachmentKey',
                        'attachmentKeyIv'
                    ]),
                ])->except(['id', 'chat_room_message_id'])->toArray()
            );

            $attachmentsDto[] = $attachmentDto;
        }

        $newMessage = $messageService->createMessageWithAttachments($messageDto, $attachmentsDto);

        $newMessage->load(['user', 'attachments']);

        broadcast(new ChatRoomMessageSent($newMessage));

        return response()->json($newMessage);
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
        ChatRoomMessageService $messageService,
    ): JsonResponse {
        $messageDto = ChatRoomMessageDto::fromArray($message->toArray());

        $isDeleted = $messageService->deleteMessage($message);

        if ($isDeleted) {
            broadcast(new ChatRoomMessageRemoved($messageDto))->toOthers();
        }
        return response()->json(compact('isDeleted'));
    }

    public function downloadAttachment(ChatRoomMessageAttachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $attachment);

        return Storage::download($attachment->path, $attachment->name);
    }
}
