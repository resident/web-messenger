<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

    public function search(string $name): JsonResponse
    {
        $users = User::query()
            ->where('name', 'LIKE', "%{$name}%")
            ->with('avatar')
            ->orderByRaw("CASE WHEN name = ? THEN 1 ELSE 2 END", [$name])
            ->limit(10)
            ->get();
        return response()->json($users);
    }
}
