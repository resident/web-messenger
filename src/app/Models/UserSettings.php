<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VisibilityPrivacyEnum;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
            'status_visibility' => 'string',
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
