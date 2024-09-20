<?php

declare(strict_types=1);

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
