<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class ChatRoomRepository
{
    public function createChatRoom(ChatRoomDto $chatRoomDto): ChatRoom
    {
        return ChatRoom::create($chatRoomDto->toArray());
    }

    /**
     * @param User $user
     * @return EloquentCollection<int, ChatRoom>
     */
    public function getUserChatRoomsDesc(User $user): EloquentCollection
    {
        return $user->chatRooms()
            ->with(['users', 'messages' => fn($q) => $q->with('user')->latest()->take(1)])
            ->orderByDesc('id')
            ->get();
    }

    /**
     * @param ChatRoom $chatRoom
     * @param array<string, string> $values
     * @return bool
     */
    public function updateChatRoom(ChatRoom $chatRoom, array $values): bool
    {
        return $chatRoom->update($values);
    }

    public function deleteChatRoom(ChatRoom $chatRoom): ?bool
    {
        return $chatRoom->delete();
    }

    public function getAttachmentRefsDiff(ChatRoom $chatRoom): Collection
    {
        $chatRoomRefs = DB::table('chat_room_message_attachments')
            ->selectRaw('path, count(path) as count')
            ->whereIn(
                'chat_room_message_id',
                fn($q) => $q->select('id')->from('chat_room_messages')->where('chat_room_id', $chatRoom->id)
            )
            ->groupBy('path')
            ->get()
            ->mapWithKeys(fn($ref) => [$ref->path => $ref->count]);

        $allRefs = DB::table('chat_room_message_attachments')
            ->selectRaw('path, count(path) as count')
            ->whereIn('path', $chatRoomRefs->keys())
            ->groupBy('path')
            ->get()
            ->mapWithKeys(fn($ref) => [$ref->path => $ref->count]);

        return $chatRoomRefs->transform(fn($count, $path) => $allRefs[$path] - $count);
    }
}
