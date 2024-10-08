<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'canRegister' => Route::has('register'),
            'status' => session('status'),
        ]);
    }

    /**
     * Display the two-factor login view.
     */
    public function twoFactorLogin(): Response
    {
        return Inertia::render('Auth/TwoFactorLogin', [
            'status' => session('status'),
        ]);
    }

}
