<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Profile;
use App\Dto\UserStatusDto;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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

    public function getProfileByUserId(int $userId): Profile
    {
        return Profile::firstOrCreate(['user_id' => $userId]);
    }

    /**
     * Get user status (online/offline, time)
     * - Used by Relevant Users (e.g. contact of user 'A', when 'A' has status_visibility = contacts)
     * -- UserStatusDto to pass only time, without other info...
     * 
     * @param int $userId
     * @return \App\Dto\UserStatusDto
     */
    public function getUserStatus(int $userId): UserStatusDto
    {
        $profile = $this->getProfileByUserId($userId);
        return new UserStatusDto(
            user_id: $userId,
            is_online: $profile->is_online,
            last_seen_at: $profile->last_seen_at?->toDateTimeString(),
        );
    }

    public function getUsersStatus(array $userIds): array
    {
        $profiles = Profile::whereIn('user_id', $userIds)->get();

        $statuses = [];
        foreach ($profiles as $profile) {
            $statuses[$profile->user_id] = new UserStatusDto(
                user_id: $profile->user_id,
                is_online: $profile->is_online,
                last_seen_at: $profile->last_seen_at?->toDateTimeString(),
            );
        }

        return $statuses;
    }

    /**
     * Update Last Seen At Time
     * 
     * @param int $userId
     * @return bool
     */
    public function updateLastSeenAt(int $userId, bool $isOnline): bool
    {
        return DB::transaction(
            function () use ($userId, $isOnline) {
                $profile = $this->getProfileByUserId($userId);
                $profile->is_online = $isOnline;
                $profile->last_seen_at = Carbon::now()->toDateTimeString();

                return $profile->save();
            }
        );
    }
}
