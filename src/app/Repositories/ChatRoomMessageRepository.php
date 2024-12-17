<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomMessageDto;
use App\Enums\MessageStatusEnum;
use App\Models\ChatRoomMessage;
use App\Models\ChatRoomMessageSeen;
use App\Models\ChatRoom;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;


final class ChatRoomMessageRepository
{
    /**
     * @param string $chatRoomId
     * @param string|null $startId
     * @param int|null $count
     * @return Collection<int, ChatRoomMessage>
     */
    public function getMessages(string $chatRoomId, int $count = 20, ?string $startId = null, bool $upwards = true): Collection
    {
        /*Log::info('Fetching messages', [
            'chatRoomId' => $chatRoomId,
            'count' => $count,
            'startId' => $startId,
            'upwards' => $upwards,
        ]);*/

        $startMessage = ChatRoomMessage::find($startId);

        $results = ChatRoomMessage::query()
            ->where('chat_room_id', $chatRoomId)
            ->take($count)
            ->when($startMessage !== null, function ($q) use ($startMessage, $upwards) {
                if ($upwards) {
                    // Older (scrolling up)
                    //Log::debug('Scrolling upwards', ['startId' => $startMessage->created_at]);
                    $q->where('created_at', '<', $startMessage->created_at);
                } else {
                    // Newer (scrolling down)
                    //Log::debug('Scrolling downwards', ['startId' => $startMessage->created_at]);
                    $q->where('created_at', '>', $startMessage->created_at);
                }
            })
            ->orderBy('id', $upwards ? 'desc' : 'asc')
            ->with(['user.avatar', 'attachments'])
            ->get();

        /*Log::info('Messages fetched', [
            'total_messages' => $results->count(),
        ]);*/

        return $upwards ? $results->reverse()->values() : $results->values();
    }

    public function getFirstUnread(ChatRoom $chatRoom, int $userId, int $offset)
    {
        $pivot = $chatRoom->users()->where('user_id', $userId)->first()?->pivot;
        $lastReadAt = $pivot->last_read_at;

        $unreadMessage = $chatRoom->messages()
            ->when($lastReadAt, fn($q) => $q->where('created_at', '>', $lastReadAt))
            ->orderBy('created_at', 'asc')
            ->skip($offset - 1)
            ->take(1)
            ->with(['user.avatar', 'attachments'])
            ->first();

        return $unreadMessage;
    }

    public function getLastMessage(ChatRoom $chatRoom)
    {
        $lastMessage = $chatRoom->messages()
            ->with(['user.avatar', 'attachments'])
            ->latest()
            ->first();

        /*Log::info('Fetched last message for chat room', [
            'chatRoomId' => $chatRoom->id,
            'lastMessageId' => $lastMessage?->id,
            'lastMessageTime' => $lastMessage?->created_at,
        ]);*/

        return $lastMessage;
    }

    public function createMessage(ChatRoomMessageDto $chatRoomMessageDto): ChatRoomMessage
    {
        return ChatRoomMessage::unguarded(fn() => ChatRoomMessage::query()->create($chatRoomMessageDto->toArray()));
    }

    public function deleteMessage(ChatRoomMessage $message): ?bool
    {
        return $message->delete();
    }

    public function updateMessageStatus(ChatRoomMessage $message, MessageStatusEnum $status): bool
    {
        $message->status = $status;
        return $message->save();
    }

    public function createOrUpdateMessageSeen(string $messageId, int $userId, bool $seen): ChatRoomMessageSeen
    {
        return
            ChatRoomMessageSeen::updateOrCreate(
                ['message_id' => $messageId, 'user_id' => $userId],
                ['seen' => $seen]
            );
    }

    public function getSeenByUsers(string $messageId)
    {
        return ChatRoomMessageSeen::with('user')
            ->where('message_id', $messageId)
            ->get();
    }
}
