<?php

namespace App\Events;

use App\Dto\UserStatusDto;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOnlineStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public readonly UserStatusDto $userStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(UserStatusDto $userStatus)
    {
        $this->userStatus = $userStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }

    /**
     * Data that will be broadcasted
     * 
     * @return array
     */
    public function broadcastWith(): array
    {
        return $this->userStatus->toArray();
    }
}
