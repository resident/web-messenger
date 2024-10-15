<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\ProfileService;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id): bool {
    return $user->id === $id;
});

Broadcast::channel('chat-room.{chatRoomId}', function (User $user, string $chatRoomId): bool {
    return $user->chatRooms()->find($chatRoomId) !== null;
});

Broadcast::channel('chat-rooms.{userId}', function (User $user, int $userId): bool {
    return $user->id === $userId;
});

// Використовується користувачем для оновлення свого статусу та отримання статусу інших
Broadcast::channel('user-status.{userId}', function (User $user, int $id): bool {
    return $user->id === $id;
});
