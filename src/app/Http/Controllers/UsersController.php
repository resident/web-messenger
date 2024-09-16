<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UsersController extends Controller
{
    public function get(string $name): JsonResponse
    {
        $user = User::query()
            ->select(['id', 'name', 'public_key'])
            ->where('name', $name)
            ->first();

        if (!$user) {
            abort(404, 'User not found');
        }

        return response()->json($user);
    }
}
