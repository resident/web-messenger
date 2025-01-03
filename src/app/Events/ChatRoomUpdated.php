<?php

namespace App\Events;

use App\Models\ChatRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatRoomUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $chatRoomId;

    /**
     * Create a new event instance.
     */
    public function __construct(
        ChatRoom $chatRoom,
        public readonly array $changes = []
    ) {
        $this->chatRoomId = $chatRoom->id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("chat-room.{$this->chatRoomId}"),
        ];
    }

    public function broadcastWith(): array
    {
        $data = [
            'chatRoomId' => $this->chatRoomId,
            'changes' => $this->changes,
        ];

        return $data;
    }
}
