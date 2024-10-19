<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\ProfileService;
use Laravel\Reverb\Events\ChannelCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

final class HandleChannelCreated
{
    /**
     * Create the event listener.
     */
    public function __construct(
        public ProfileService $profileService,
    ) {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ChannelCreated $event): void
    {
        $channelName = $event->channel->name();

        if (preg_match('/^private-user-status\.(\d+)$/', $channelName, $matches)) {
            $userId = (int) $matches[1];

            $this->profileService->updateUserStatus($userId, true);
        }
    }
}
