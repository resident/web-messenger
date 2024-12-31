<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\MainController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RotateKeysController;
use App\Http\Controllers\UserCallController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\UserSettingsController;
use App\Http\Controllers\UserStatusController;
use App\Http\Controllers\UserStorageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn() => Route::respondWithRoute(request()->user() ? 'main' : 'login'));

Route::get('/main/{chatRoom?}', [MainController::class, 'index'])->middleware(['auth', 'verified'])->name('main');

Route::get('/dropbox', function () {
    return Inertia::render('Dropbox/Dropbox');
})->middleware(['auth', 'verified'])->name('dropbox.auth');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/avatar/update', [AvatarController::class, 'store'])->name('avatar.update');
    Route::delete('/avatar/delete', [AvatarController::class, 'delete'])->name('avatar.delete');

    Route::get('/contact/contacts', [ContactController::class, 'getAllContacts'])->name('contact.contacts');
    Route::get('/contact/index', [ContactController::class, 'index'])->name('contact.show');
    Route::post('/contact/add', [ContactController::class, 'store'])->name('contact.add');
    Route::delete('/contact/delete', [ContactController::class, 'delete'])->name('contact.delete');

    Route::get('/users/{name}', [UsersController::class, 'get'])->name('users.get');
    Route::get('/users/search/{name}', [UsersController::class, 'search'])->name('users.search');

    Route::put('/rotate-keys', [RotateKeysController::class, 'update'])->name('rotate-keys.update');

    Route::apiResource('backend-storage', UserStorageController::class);
    Route::group(['prefix' => 'backend-storage', 'as' => 'backend-storage.'], function () {
        Route::get('/key/{key}', [UserStorageController::class, 'showByKey'])->name('show-key');
        Route::put('/key/{key}', [UserStorageController::class, 'updateByKey'])->name('update-key');
        Route::delete('/key/{key}', [UserStorageController::class, 'destroyByKey'])->name('destroy-key');
    });

    Route::get('/user-status/{userId}', [UserStatusController::class, 'getUserStatus'])->name('user-status.get');
    Route::post('/users-status', [UserStatusController::class, 'getUsersStatus'])->name('users-status.get');

    Route::get('/user/settings', [UserSettingsController::class, 'get'])->name('user-settings.get');
    Route::put('/user/settings', [UserSettingsController::class, 'update'])->name('user-settings.update');

    Route::get('/user/profile/{user}', [UserProfileController::class, 'show'])->name('user-profile.show');

    Route::post('/user/call/{fromUser}/{toUser}/sdp-description', [UserCallController::class, 'sdpDescription'])
        ->name('user-call.sdp-description');

    Route::post('/user/call/{user}/ice-candidate', [UserCallController::class, 'iceCandidate'])
        ->name('user-call.ice-candidate');

    Route::post('/user/call/{user}/end-call', [UserCallController::class, 'endCall'])
        ->name('user-call.end-call');
});

require __DIR__ . '/auth.php';
require __DIR__ . '/chat-rooms.php';
