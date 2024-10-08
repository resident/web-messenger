<?php

use App\Http\Controllers\ChatRoomMessagesController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RotateKeysController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\UserStorageController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/dropbox', function () {
    return Inertia::render('Dropbox/Dropbox');
})->middleware(['auth', 'verified'])->name('dropbox.auth');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/chat-rooms', [ChatRoomsController::class, 'index'])->name('chat_rooms.index');
    Route::get('/chat-rooms/list', [ChatRoomsController::class, 'list'])->name('chat_rooms.list');
    Route::get('/chat-rooms/create', [ChatRoomsController::class, 'create'])->name('chat_rooms.create');
    Route::post('/chat-rooms/store', [ChatRoomsController::class, 'store'])->name('chat_rooms.store');

    Route::get('/chat-rooms/{chatRoomId}', [ChatRoomsController::class, 'show'])
        ->whereUuid('chatRoomId')
        ->name('chat_rooms.show');

    Route::put('/chat-rooms/{chatRoom}', [ChatRoomsController::class, 'update'])
        ->whereUuid('chatRoom')->name('chat_rooms.update');

    Route::get('/chat-rooms/{chatRoom}/messages/{count?}/{startId?}', [ChatRoomMessagesController::class, 'index'])
        ->whereUuid('chatRoom')
        ->whereNumber('count')
        ->whereUuid('startId')
        ->name('chat_rooms.messages.index');

    Route::post('/chat-rooms/{chatRoom}/messages', [ChatRoomMessagesController::class, 'store'])
        ->whereUuid('chatRoom')
        ->name('chat_rooms.messages.store');

    Route::delete('/chat-rooms/{chatRoom}/messages/{message}', [ChatRoomMessagesController::class, 'destroy'])
        ->whereUuid('chatRoom')
        ->whereUuid('message')
        ->name('chat_rooms.messages.destroy');

    Route::get(
        '/chat-rooms/messages/attachments/{attachment}',
        [ChatRoomMessagesController::class, 'downloadAttachment']
    )
        ->whereUuid('attachment')
        ->name('chat_rooms.messages.download_attachment');

    Route::get('/users/{name}', [UsersController::class, 'get'])->name('users.get');

    Route::put('/rotate-keys', [RotateKeysController::class, 'update'])->name('rotate-keys.update');

    Route::apiResource('backend-storage', UserStorageController::class);
    Route::group(['prefix' => 'backend-storage', 'as' => 'backend-storage.'], function () {
        Route::get('/key/{key}', [UserStorageController::class, 'showByKey'])->name('show-key');
        Route::put('/key/{key}', [UserStorageController::class, 'updateByKey'])->name('update-key');
        Route::delete('/key/{key}', [UserStorageController::class, 'destroyByKey'])->name('destroy-key');
    });
});

require __DIR__ . '/auth.php';
