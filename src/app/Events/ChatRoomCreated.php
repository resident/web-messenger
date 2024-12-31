<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\ChatRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ChatRoomCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $chatRoomId;

    /**
     * Create a new event instance.
     */
    public function __construct(protected ChatRoom $chatRoom)
    {
        $this->chatRoomId = $chatRoom->id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return array_map(fn($user) => new PrivateChannel("chat-rooms.$user->id"), [...$this->chatRoom->users]);
    }
}
