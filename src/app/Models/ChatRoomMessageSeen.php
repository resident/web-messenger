<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    use MassPrunable;

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

    /**
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::whereHas('message', function ($query) {
            $query->where('created_at', '<=', now()->subDays(7));
        });
    }
}
