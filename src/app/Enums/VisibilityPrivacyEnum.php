<?php

namespace App\Enums;

enum VisibilityPrivacyEnum: string
{
    case EVERYONE = 'everyone';
    case CONTACTS = 'contacts';
    case NOBODY = 'nobody';


    /**
     * Gets all enum values
     * 
     * @return array
     */
    public static function casesAsValues(): array
    {
        return array_column(self::cases(), 'value');
    }
}
