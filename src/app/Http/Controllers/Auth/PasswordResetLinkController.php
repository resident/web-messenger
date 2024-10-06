<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;

final class PasswordResetLinkController extends Controller
{
    public function create(): \Inertia\Response
    {
        return inertia('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }
}
