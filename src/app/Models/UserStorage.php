<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\Json;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property int $user_id
 * @property string $key
 * @property string $value
 * @property string $created_at
 * @property string $updated_at
 */
final class UserStorage extends Model
{
    use HasUuids;
    use HasFactory;

    protected $table = 'user_storage';

    protected function casts(): array
    {
        return [
            'value' => Json::class,
        ];
    }
}
