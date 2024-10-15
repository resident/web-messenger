<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\ProfileService;
use Laravel\Reverb\Events\ChannelRemoved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

final class HandleChannelRemoved
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
    public function handle(ChannelRemoved $event): void
    {
        Log::info("Handle Channel Remove");
        $channelName = $event->channel->name();

        if (preg_match('/^private-user-status\.(\d+)$/', $channelName, $matches)) {
            $userId = (int) $matches[1];

            $this->profileService->updateUserStatus($userId, false);
            Log::info("Channel $channelName removed - 1");
        }
    }
}
