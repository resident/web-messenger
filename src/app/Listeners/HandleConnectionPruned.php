<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Services\ProfileService;
use Laravel\Reverb\Events\ConnectionPruned;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

final class HandleConnectionPruned
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
    public function handle(ConnectionPruned $event): void
    {
        // userId...?
        $channelName = $event->connection->data('channel');

        if (!$channelName) {
            return;
        }

        if (preg_match('/^private-user-status\.(\d+)$/', $channelName, $matches)) {
            $userId = (int) $matches[1];

            $this->profileService->updateUserStatus($userId, false);
        }
    }
}
