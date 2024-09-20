<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomMessageDto;
use App\Models\ChatRoomMessage;
use Illuminate\Database\Eloquent\Collection;

final class ChatRoomMessageRepository
{
    /**
     * @param string $chatRoomId
     * @param string|null $startId
     * @param int|null $count
     * @return Collection<int, ChatRoomMessage>
     */
    public function getMessages(string $chatRoomId, ?int $count = null, ?string $startId = null): Collection
    {
        $results = ChatRoomMessage::query()
            ->where('chat_room_id', $chatRoomId)
            ->when($count !== null, fn($q) => $q->take($count))
            ->when($startId !== null, fn($q) => $q->where('id', '<', $startId))
            ->orderByDesc('id')
            ->with(['user', 'attachments'])
            ->get();

        return $results->reverse()->values();
    }

    public function createMessage(ChatRoomMessageDto $chatRoomMessageDto): ChatRoomMessage
    {
        return ChatRoomMessage::unguarded(fn() => ChatRoomMessage::query()->create($chatRoomMessageDto->toArray()));
    }

    public function deleteMessage(ChatRoomMessage $message): ?bool
    {
        return $message->delete();
    }
}
