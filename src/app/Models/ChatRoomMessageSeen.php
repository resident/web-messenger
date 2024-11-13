<?php

declare(strict_types=1);

namespace App\Models;

use App\Dto\ChatRoomMessageDto;
use App\Enums\MessageStatusEnum;
use App\Events\ChatRoomMessageRemoved;
use App\Services\ChatRoomMessageAttachmentService;
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
 * @property string $message_id
 * @property int $user_id
 * @property string $status
 * @property string $created_at
 * @property string $updated_at
 */
class ChatRoomMessageSeen extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'message_id',
        'user_id',
        'seen',
    ];

    protected function casts(): array
    {
        return [
            'seen' => 'boolean',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatRoomMessage::class, 'message_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
