<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VisibilityPrivacyEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property VisibilityPrivacyEnum $status_visibility
 * @property Carbon created_at
 * @property Carbon updated_at
 */
class UserSettings extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status_visibility',
        // ...
    ];

    protected function casts(): array
    {
        return [
            'status_visibility' => VisibilityPrivacyEnum::class,
        ];
    }

    /**
     * Connection with 'User'
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
