<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\UserOnlineStatusChanged;
use App\Repositories\ProfileRepository;
use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use App\Models\User;
use App\Repositories\UserSettingsRepository;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

final class ProfileService
{
    public function __construct(
        public ProfileRepository $profileRepository,
        public UserSettingsRepository $userSettingsRepository,
    ) {}

    public function updateUserStatus(int $userId, bool $isOnline): void
    {
        DB::transaction(function () use ($userId, $isOnline) {
            $this->profileRepository->updateLastSeenAt($userId, $isOnline);
            $userStatus = $this->profileRepository->getUserStatus($userId);
            if (!$userStatus) {
                throw new Exception("User status not found for user ID: {$userId}");
            }

            $this->updateRedisUserStatus($userStatus);

            broadcast(new UserOnlineStatusChanged($userStatus))->toOthers();
        });
    }

    protected function updateRedisUserStatus(UserStatusDto $userStatus): void
    {
        $redisKey = "user_status:{$userStatus->user_id}";
        Log::info("Update Redis User Status: {$userStatus->user_id}");

        $redisCache = Cache::store('redis');

        if ($userStatus->is_online) {
            Log::info("Update Redis User Status: {$userStatus->user_id} - put key");
            $redisCache->put($redisKey, $userStatus->toArray(), 600);
        } else if ($redisCache->has($redisKey) && !$userStatus->is_online) {
            Log::info("Update Redis User Status: {$userStatus->user_id} - remove key");
            $redisCache->forget($redisKey);
        }
    }

    public function getUserStatus(User $authUser, int $userId): ?UserStatusDto
    {
        if (!$this->canSeeStatus($authUser, $userId)) {
            return null;
        }

        $redisKey = "user_status:{$userId}";

        $redisCache = Cache::store('redis');
        $cachedStatus = $redisCache->get($redisKey);

        if ($cachedStatus) {
            Log::info("Get User Status {$userId} - Cached Status");
            return UserStatusDto::fromArray($cachedStatus);
        }

        $userStatus = $this->profileRepository->getUserStatus($userId);
        if ($userStatus->is_online) {
            Cache::store('redis')->put("user_status:{$userId}", $userStatus->toArray(), 600);
        }
        return $userStatus;
    }

    public function canSeeStatus(User $currentUser, int $targetUserId): bool
    {
        $settings = $this->userSettingsRepository->getUserSettingsByUserId($targetUserId);
        if (!$settings) {
            return false;
        }

        switch ($settings->status_visibility) {
            case VisibilityPrivacyEnum::EVERYONE->value:
                return true;
            case VisibilityPrivacyEnum::CONTACTS->value:
                // return {contacts logic}
                return true;
            case VisibilityPrivacyEnum::NOBODY->value:
                return false;
            default:
                return false;
        }
    }
}
