<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use App\Services\ProfileService;
use Inertia\Response as InertiaResponse;

final class MainController extends Controller
{
    public function index(?ChatRoom $chatRoom = null): InertiaResponse
    {
        $profileService = app(ProfileService::class);
        if ($chatRoom) {
            $user = request()->user();
            $chatRoom = $user->chatRooms()->with('users')->where('chat_room_id', $chatRoom->id)->first();
            if (!$chatRoom) {
                abort(404);
            }
            $userIds = $chatRoom->users->pluck('id')->values()->all();
            $statuses = $profileService->getUsersStatus($user, $userIds);
            $chatRoom->users = $chatRoom->users->map(function ($chatUser) use ($statuses) {
                $status = $statuses[$chatUser->id] ?? null;
                $chatUser->is_online = $status?->is_online ?? false;
                $chatUser->last_seen_at = $status?->last_seen_at;
                return $chatUser;
            });
        }
        return inertia('Main', compact('chatRoom'));
    }
}
