<?php

namespace App\Repositories;

use App\Models\UserSettings;
use App\Enums\VisibilityPrivacyEnum;

final class UserSettingsRepository
{
    /**
     * Create 'UserSettings' of 'User'
     * 
     * @param int $userId
     * @return UserSettings
     */
    public function createUserSettings(int $userId): UserSettings
    {
        return UserSettings::create([
            'user_id' => $userId,
            'status_visibility' => VisibilityPrivacyEnum::EVERYONE->value,
        ]);
    }

    public function getUserSettingsByUserId(int $userId): ?UserSettings
    {
        return UserSettings::where('user_id', $userId)->first();
    }

    /**
     * Update status_visibility setting
     * 
     * @param int $userId
     * @param string $visibility
     * @return bool
     */
    public function updateStatusVisibility(int $userId, string $visibility): bool
    {
        $settings = $this->getUserSettingsByUserId($userId);
        if (!$settings) {
            return false;
        }
        if (!in_array($visibility, VisibilityPrivacyEnum::casesAsValues(), true)) {
            $visibility = VisibilityPrivacyEnum::EVERYONE->value;
        }

        $settings->status_visibility = $visibility;
        return $settings->save();
    }
}
