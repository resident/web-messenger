<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AvatarRequest;
use App\Models\Avatar;
use App\Models\User;
use App\Models\ChatRoom;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class AvatarController extends Controller
{
    public function store(AvatarRequest $request)
    {
        $user = $request->user();

        if ($user->avatar) {
            $this->removeAvatar($user);
        }

        if ($request->file('avatar')) {
            $extension = $request->file('avatar')->getClientOriginalExtension();
            $filename = 'avatar_' . Str::uuid() . '.' . $extension;
            $path = $request->file('avatar')->storeAs('public/avatars', $filename);

            $avatar = new Avatar([
                'path' => $filename,
            ]);

            $user->avatar()->save($avatar);

            return back()->with('success', 'Avatar uploaded successfully. Path: ' . $path);
        }

        return back()->withErrors(['error' => 'File not uploaded.']);
    }

    public function delete(Request $request)
    {
        $user = $request->user();
        if ($user->avatar) {
            $this->removeAvatar($user);
        }
    }

    private function removeAvatar(User $user)
    {
        Storage::delete("public/avatars/{$user->avatar->path}");
        $user->avatar->delete();
    }

    public function getAvatars(ChatRoom $chatRoom)
    {
        $avatars = $chatRoom->users()->with('avatar')->get();
        return response()->json($avatars);
    }
}
