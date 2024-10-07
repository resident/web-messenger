<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $title
 * @property int $auto_remove_timeout
 * @property string $created_at
 * @property string $updated_at
 */
class ChatRoom extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'id',
        'title',
        'auto_remove_timeout',
        'created_at',
        'updated_at',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(ChatRoomUser::class)
            ->withPivot(['chat_room_key']);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatRoomMessage::class);
    }
}
