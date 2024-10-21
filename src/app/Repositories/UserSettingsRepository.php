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

    public function getUserSettingsByUserId(int $userId): UserSettings
    {
        return UserSettings::firstOrCreate(['user_id' => $userId]);
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
        if (!in_array($visibility, VisibilityPrivacyEnum::casesAsValues(), true)) {
            $visibility = VisibilityPrivacyEnum::EVERYONE->value;
        }

        $settings->status_visibility = $visibility;
        return $settings->save();
    }
}
