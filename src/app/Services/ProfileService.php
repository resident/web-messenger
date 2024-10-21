<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\UserOnlineStatusChanged;
use App\Repositories\ProfileRepository;
use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use App\Models\User;
use App\Repositories\UserSettingsRepository;
use Illuminate\Support\Facades\Cache;

final class ProfileService
{
    public function __construct(
        public ProfileRepository $profileRepository,
        public UserSettingsRepository $userSettingsRepository,
    ) {}

    public function updateUserStatus(int $userId, bool $isOnline): void
    {

        $this->profileRepository->updateLastSeenAt($userId, $isOnline);
        $userStatus = $this->profileRepository->getUserStatus($userId);
        $this->updateRedisUserStatus($userStatus);
        broadcast(new UserOnlineStatusChanged($userStatus))->toOthers();
    }

    protected function updateRedisUserStatus(UserStatusDto $userStatus): void
    {
        $redisKey = "user_status:{$userStatus->user_id}";

        $redisCache = Cache::store('redis');

        if ($userStatus->is_online) {
            $redisCache->put($redisKey, $userStatus->toArray(), 600);
        } else if ($redisCache->has($redisKey) && !$userStatus->is_online) {
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
            return UserStatusDto::fromArray($cachedStatus);
        }

        $userStatus = $this->profileRepository->getUserStatus($userId);
        if ($userStatus->is_online) {
            Cache::store('redis')->put("user_status:{$userId}", $userStatus->toArray(), 600);
        }
        return $userStatus;
    }

    public function getUsersStatus(User $authUser, array $userIds): array
    {
        $visibleUserIds = array_filter($userIds, function ($userId) use ($authUser) {
            return is_int($userId) && $this->canSeeStatus($authUser, $userId);
        });
        if (empty($visibleUserIds)) {
            return [];
        }

        $redisKeys = array_map(function ($userId) {
            return "user_status:{$userId}";
        }, $visibleUserIds);
        $redisCache = Cache::store('redis');
        $cachedStatuses = $redisCache->getMultiple($redisKeys);

        $statuses = [];
        $missingUserIds = [];
        foreach ($visibleUserIds as $userId) {
            $cachedStatus = $cachedStatuses["user_status:{$userId}"] ?? null;
            if ($cachedStatus) {
                $statuses[$userId] = UserStatusDto::fromArray($cachedStatus);
            } else {
                $missingUserIds[] = $userId;
            }
        }

        if (!empty($missingUserIds)) {
            $databaseStatuses = $this->profileRepository->getUsersStatus($missingUserIds);
            foreach ($databaseStatuses as $userStatus) {
                $statuses[$userStatus->user_id] = $userStatus;
                if ($userStatus->is_online) {
                    $redisCache->put("user_status:{$userStatus->user_id}", $userStatus->toArray(), 600);
                }
            }
        }

        return $statuses;
    }

    public function canSeeStatus(User $currentUser, int $targetUserId): bool
    {
        if ($currentUser->id === $targetUserId) {
            return true;
        }

        $settings = $this->userSettingsRepository->getUserSettingsByUserId($targetUserId);

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
