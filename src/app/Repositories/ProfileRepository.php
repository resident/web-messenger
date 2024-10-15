<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Profile;
use App\Dto\UserStatusDto;
use Illuminate\Support\Carbon;

final class ProfileRepository
{
    /**
     * Create 'Profile' of 'User'
     * 
     * @param int $userId
     * @return \App\Models\Profile
     */
    public function createProfile(int $userId): Profile
    {
        return Profile::create([
            'user_id' => $userId,
            'last_seen_at' => null,
            'is_online' => false,
        ]);
    }

    public function getProfileByUserId(int $userId): ?Profile
    {
        return Profile::where('user_id', $userId)->first();
    }

    /**
     * Get user status (online/offline, time)
     * - Used by Relevant Users (e.g. contact of user 'A', when 'A' has status_visibility = contacts)
     * -- UserStatusDto to pass only time, without other info...
     * 
     * @param int $userId
     * @return \App\Dto\UserStatusDto
     */
    public function getUserStatus(int $userId): ?UserStatusDto
    {
        $profile = $this->getProfileByUserId($userId);
        if (!$profile) {
            return null;
        }
        return new UserStatusDto(
            user_id: $userId,
            is_online: $profile->is_online,
            last_seen_at: $profile->last_seen_at?->toDateTimeString(),
        );
    }

    /**
     * Update Last Seen At Time
     * 
     * @param int $userId
     * @return bool
     */
    public function updateLastSeenAt(int $userId, bool $isOnline): bool
    {
        $profile = $this->getProfileByUserId($userId);
        if (!$profile) {
            throw new \Exception("Profile not found for user ID: {$userId}");
        }
        $profile->is_online = $isOnline;
        $profile->last_seen_at = Carbon::now()->toDateTimeString();

        return $profile->save();
    }
}
