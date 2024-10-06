<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\UserOnlineStatusChanged;
use App\Repositories\ProfileRepository;
use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use App\Models\User;
use App\Repositories\UserSettingsRepository;
use Illuminate\Support\Facades\DB;

final class ProfileService
{
    public function __construct(
        public ProfileRepository $profileRepository,
        public UserSettingsRepository $userSettingsRepository,
    ) {}

    public function updateUserLastSeen(User $user, bool $isOnline): void
    {
        DB::transaction(function () use ($user, $isOnline) {
            $this->profileRepository->updateLastSeenAt($user->id, $isOnline);
            $userStatus = $this->profileRepository->getUserStatus($user->id);

            broadcast(new UserOnlineStatusChanged($userStatus))->toOthers();
        });
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
                // return {logic}
                return true;
            case VisibilityPrivacyEnum::NOBODY->value:
                return false;
            default:
                return false;
        }
    }
}
