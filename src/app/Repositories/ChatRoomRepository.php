<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomDto;
use App\Models\ChatRoom;
use App\Models\User;
use App\Models\ChatRoomMessage;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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
        //Log::info('Fetching chat rooms for user', ['userId' => $user->id]);
        $chatRooms = $user->chatRooms()
            ->with([
                'users' => fn($q) => $q->with(['avatar']),
                'messages' => fn($q) => $q->with(['user.avatar', 'attachments'])->latest()->take(1)
            ])
            ->orderByDesc('id')
            ->get();
        //Log::info('Chat rooms fetched', ['totalChatRooms' => $chatRooms->count()]);

        $chatRooms->each(function ($chatRoom) use ($user) {
            $pivot = $chatRoom->users->where('id', $user->id)->first()?->pivot;
            $chatRoom->last_read_at = $pivot?->last_read_at;
            $chatRoom->muted = $pivot?->muted ?? false;
            /*Log::debug('Pivot details loaded for chat room', [
                'chatRoomId' => $chatRoom->id,
                'lastReadAt' => $chatRoom->last_read_at,
                'muted' => $chatRoom->muted,
            ]);*/

            $chatRoom->last_message = $chatRoom->messages->first();

            $lastReadAt = $chatRoom->last_read_at;
            $unreadCount = $this->getUnreadCount($chatRoom, $lastReadAt, $user);
            $chatRoom->unread_count = $unreadCount;

            if ($chatRoom->unread_count > 1) {
                $chatRoom->setRelation('messages', collect([]));
            }

            /*Log::info('Unread count calculated', [
                'chatRoomId' => $chatRoom->id,
                'unreadCount' => $unreadCount,
                'lastReadAt' => $lastReadAt,
                'lastMessageTime' => $chatRoom->last_message?->created_at,
            ]);*/
        });

        return $chatRooms;
    }

    public function updateLastReadAt(User $user, ChatRoom $chatRoom, string $newLastReadAt)
    {
        if ($newLastReadAt) {
            $parsedDate = Carbon::parse($newLastReadAt);
            $newLastReadAt = $parsedDate->format('Y-m-d H:i:s');
        }
        /*Log::info('Updating last_read_at', [
            'userId' => $user->id,
            'chatRoomId' => $chatRoom->id,
            'newLastReadAt' => $newLastReadAt,
        ]);*/

        $currentLastReadAt = DB::table('chat_room_user')
            ->where('chat_room_id', $chatRoom->id)
            ->where('user_id', $user->id)
            ->value('last_read_at');
        if ($currentLastReadAt && Carbon::parse($newLastReadAt)->lte(Carbon::parse($currentLastReadAt))) {
            /*Log::info('New last_read_at is not newer than the current value', [
                'userId' => $user->id,
                'chatRoomId' => $chatRoom->id,
                'currentLastReadAt' => $currentLastReadAt,
                'newLastReadAt' => $newLastReadAt,
            ]);*/
            return false;
        }

        $result = DB::table('chat_room_user')
            ->where('chat_room_id', $chatRoom->id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => $newLastReadAt]);

        /*Log::info('Last_read_at updated', [
            'userId' => $user->id,
            'chatRoomId' => $chatRoom->id,
            'result' => $result ? 'success' : 'failure',
        ]);*/

        return $result;
    }

    public function getUnreadCount(ChatRoom $chatRoom, ?string $lastReadAt, User $user)
    {
        /*Log::debug('Calculating unread count', [
            'chatRoomId' => $chatRoom->id,
            'lastReadAt' => $lastReadAt,
        ]);*/
        $unreadCount = ChatRoomMessage::where('chat_room_id', $chatRoom->id)
            ->where('user_id', '<>', $user->id)
            ->when($lastReadAt, fn($q) => $q->where('created_at', '>', $lastReadAt))
            ->count();

        /*Log::info('Unread count calculated', [
            'chatRoomId' => $chatRoom->id,
            'unreadCount' => $unreadCount,
        ]);*/

        return $unreadCount;
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
