<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Response as InertiaResponse;

final class UserProfileController extends Controller
{
    public function show(User $user): InertiaResponse
    {
        return inertia("UserProfile/Show", compact('user'));
    }
}
