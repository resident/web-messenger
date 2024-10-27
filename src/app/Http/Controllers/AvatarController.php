<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Avatar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

final class AvatarController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'avatar' => 'required|file|mimes:jpg,jpeg,png,gif|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::delete("public/avatars/{$user->avatar->path}");
            $user->avatar->delete();
        }

        if ($request->file('avatar')) {
            $extension = $request->file('avatar')->getClientOriginalExtension();
            $filename = 'avatar_' . time() . '.' . $extension;
            $path = $request->file('avatar')->storeAs('public/avatars', $filename);

            $avatar = new Avatar([
                'path' => $filename,
            ]);

            $user->avatar()->save($avatar);

            return back()->with('success', 'Avatar uploaded successfully. Path: ' . $path);
        }

        return back()->withErrors(['error' => 'File not uploaded.']);
    }
}
