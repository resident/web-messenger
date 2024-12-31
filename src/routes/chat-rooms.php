<?php

declare(strict_types=1);

use App\Events\ChatRoomCreated;
use App\Http\Controllers\ChatRoomMessagesController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\AvatarController;
use App\Models\ChatRoom;
use Illuminate\Support\Facades\Route;

Route::get('/chat-rooms/list', [ChatRoomsController::class, 'list'])->name('chat_rooms.list');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/chat-rooms/create', [ChatRoomsController::class, 'create'])->name('chat_rooms.create');
    Route::post('/chat-rooms/store', [ChatRoomsController::class, 'store'])->name('chat_rooms.store');

    Route::put('/chat-rooms/{chatRoom}', [ChatRoomsController::class, 'update'])
        ->whereUuid('chatRoom')->name('chat_rooms.update');

    Route::delete('/chat-rooms/{chatRoom}', [ChatRoomsController::class, 'destroy'])
        ->whereUuid('chatRoom')->name('chat_rooms.destroy');



    Route::put('/chat-rooms/{chatRoom}/manage-roles/{userToUpdate}', [ChatRoomsController::class, 'updateUserRoleAndPermissions'])
        ->whereUuid('chatRoom')->name('chat_rooms.manage_roles');

    Route::get('/chat-rooms/{chatRoom}/users', [ChatRoomsController::class, 'getUsers'])
        ->whereUuid('chatRoom')->name('chat_rooms.get_users');

    Route::delete('/chat-rooms/{chatRoom}/users/{userToRemove}', [ChatRoomsController::class, 'removeUser'])
        ->whereUuid('chatRoom')->name('chat_rooms.remove_user');

    Route::post('/chat-rooms/{chatRoom}/users/{userToAdd}', [ChatRoomsController::class, 'addUser'])
        ->whereUuid('chatRoom')->name('chat_rooms.add_user');
    Route::get('/chat-rooms/{chatRoom}/users/avatars', [AvatarController::class, 'getAvatars'])
        ->whereUuid('chatRoom')->name('chat_rooms.avatars');
    Route::get('/chat-rooms/{chatRoom}', [ChatRoomsController::class, 'getChatRoom'])
        ->whereUuid('chatRoom')->name('chat_rooms.get_chat_room');



    Route::get('/chat-rooms/{chatRoom}/messages/{count?}/{startId?}', [ChatRoomMessagesController::class, 'index'])
        ->whereUuid(['chatRoom', 'startId'])
        ->whereNumber('count')
        ->name('chat_rooms.messages.index');

    Route::post('/chat-rooms/{chatRoom}/messages', [ChatRoomMessagesController::class, 'store'])
        ->whereUuid('chatRoom')
        ->name('chat_rooms.messages.store');

    Route::post('/chat-rooms/{chatRoom}/messages/forward/{message}', [ChatRoomMessagesController::class, 'forward'])
        ->whereUuid(['chatRoom', 'message'])
        ->name('chat_rooms.messages.forward');

    Route::delete('/chat-rooms/{chatRoom}/messages/{message}', [ChatRoomMessagesController::class, 'destroy'])
        ->whereUuid(['chatRoom', 'message'])
        ->name('chat_rooms.messages.destroy');

    Route::get(
        '/chat-rooms/messages/attachments/{attachment}',
        [ChatRoomMessagesController::class, 'downloadAttachment']
    )
        ->whereUuid('attachment')
        ->name('chat_rooms.messages.download_attachment');

    /*
    Route::post('/chat-rooms/{chatRoom}/messages/delivered', [ChatRoomMessagesController::class, 'markAsDelivered'])
        ->whereUuid('chatRoom')
        ->name('chat_rooms.messages.mark_as_delivered');
    */

    Route::post('/chat-rooms/{chatRoom}/messages/{message}/seen', [ChatRoomMessagesController::class, 'markAsSeen'])
        ->whereUuid(['chatRoom', 'message'])
        ->name('chat_rooms.messages.mark_as_seen');

    Route::get('/chat-rooms/{chatRoom}/messages/{message}/seen-by', [ChatRoomMessagesController::class, 'getSeenBy'])
        ->whereUuid(['chatRoom', 'message'])
        ->name('chat_rooms.messages.get_seen_by');

    Route::get('/chat-rooms/{chatRoom}/messages/last-message', [ChatRoomMessagesController::class, 'getLastMessage'])
        ->whereUuid('chatRoom')
        ->name('chat_rooms.messages.get_last_message');

    Route::post('/chat-rooms/{chatRoom}/last-read-at', [ChatRoomsController::class, 'updateLastReadAt'])
        ->whereUuid('chatRoom')
        ->name('chat_rooms.last_read_at.update');
});
