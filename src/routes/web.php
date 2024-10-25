<?php


use App\Http\Controllers\MainController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RotateKeysController;
use App\Http\Controllers\UsersController;
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
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

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
require __DIR__ . '/chat-rooms.php';
