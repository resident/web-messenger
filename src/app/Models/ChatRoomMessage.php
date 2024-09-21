<?php

declare(strict_types=1);

namespace App\Models;

use App\Dto\ChatRoomMessageDto;
use App\Events\ChatRoomMessageRemoved;
use App\Services\ChatRoomMessageAttachmentService;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * @property string $id
 * @property string $chat_room_id
 * @property string $user_id
 * @property string $message
 * @property string $message_iv
 * @property string $message_key
 * @property string $message_key_iv
 * @property string $created_at
 * @property string $updated_at
 */
class ChatRoomMessage extends Model
{
    use HasFactory;
    use HasUuids;
    use Prunable;

    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ChatRoomMessageAttachment::class);
    }

    /**
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::join('chat_rooms', 'chat_room_messages.chat_room_id', '=', 'chat_rooms.id')
            ->where(
                DB::raw('DATE_ADD(chat_room_messages.created_at, INTERVAL chat_rooms.auto_remove_timeout SECOND)'),
                '<=',
                now()
            )
            ->select('chat_room_messages.*');
    }

    /**
     * Prepare the model for pruning.
     */
    protected function pruning(): void
    {
        /** @var ChatRoomMessageAttachmentService $service */
        $service = app(ChatRoomMessageAttachmentService::class);

        $service->deleteAttachments($this);

        broadcast(new ChatRoomMessageRemoved(ChatRoomMessageDto::fromArray($this->toArray())));
    }
}