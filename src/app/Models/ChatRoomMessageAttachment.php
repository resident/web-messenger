<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

/**
 * @property string $id
 * @property string $chat_room_message_id
 * @property string $path
 * @property string $name
 * @property string $mime_type
 * @property int $size
 * @property string $attachment_iv
 * @property string $attachment_key
 * @property string $attachment_key_iv
 * @property string $created_at
 * @property string $updated_at
 */
class ChatRoomMessageAttachment extends Model
{
    use HasFactory;
    use HasUuids;

    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatRoomMessage::class, 'chat_room_message_id');
    }

    public function chatRoom(): HasOneThrough
    {
        return $this->hasOneThrough(
            ChatRoom::class,
            ChatRoomMessage::class,
            'id',
            'id',
            'chat_room_message_id',
            'chat_room_id'
        );
    }
}
