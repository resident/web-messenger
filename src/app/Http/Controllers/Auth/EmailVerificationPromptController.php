<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;

final class EmailVerificationPromptController extends Controller
{
    public function __invoke(Request $request): RedirectResponse|InertiaResponse
    {
        return $request->user()->hasVerifiedEmail()
            ? redirect()->intended(route('main', absolute: false))
            : inertia('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
