<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::get('two-factor-challenge', [AuthenticatedSessionController::class, 'twoFactorLogin'])
        ->name('two-factor.login');

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');

    Route::get('reset-password/{token}', [PasswordResetController::class, 'create'])
        ->name('password.reset');
});

Route::middleware('auth')->group(function () {
    Route::get('email/verify', EmailVerificationPromptController::class)
        ->name('verification.notice');
});
