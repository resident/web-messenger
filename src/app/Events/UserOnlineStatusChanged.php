<?php

namespace App\Events;

use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Repositories\UserRepository;
use App\Repositories\UserSettingsRepository;

class UserOnlineStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $connection = 'sync';

    public UserStatusDto $userStatus;
    protected UserRepository $userRepository;
    protected UserSettingsRepository $userSettingsRepository;

    /**
     * Create a new event instance.
     */
    public function __construct(UserStatusDto $userStatus)
    {
        $this->userStatus = $userStatus;
        $this->userRepository = app(UserRepository::class);
        $this->userSettingsRepository = app(UserSettingsRepository::class);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $userId = $this->userStatus->user_id;
        $user = $this->userRepository->getUserById($this->userStatus->user_id);
        if (!$user) {
            return [];
        }

        $userSettings = $this->userSettingsRepository->getUserSettingsByUserId($userId);
        if (!$userSettings) {
            return [];
        }

        $visibility = $userSettings->status_visibility;

        $channels = [];

        switch ($visibility) {
            case VisibilityPrivacyEnum::EVERYONE->value:
                //$contacts = $user->contacts()->pluck('id')->toArray();
                //foreach ($contacts as $contactId) {
                //    $channels[] = new PrivateChannel("user-status.$contactId");
                //}

                $chatRoomIds = $user->chatRooms()->pluck('chat_rooms.id')->toArray();
                foreach ($chatRoomIds as $chatRoomId) {
                    $channels[] = new PrivateChannel("chat-room.$chatRoomId");
                }
                break;
            case VisibilityPrivacyEnum::CONTACTS->value:
                //$contacts = $user->contacts()->pluck('id')->toArray();
                //foreach ($contacts as $contactId) {
                //    $channels[] = new PrivateChannel("user-status.$contactId");
                //}

                //$chatRooms = $user->chatRooms()
                //    ->whereDoesntHave('users', function ($query) use ($contacts) {
                //        $query->whereNotIn('users.id', $contacts);
                //    })->pluck('id')->toArray();
                //foreach ($chatRooms as $chatRoomId) {
                //    $channels[] = new PrivateChannel("chat-room.$chatRoomId");
                //}
                break;
            case VisibilityPrivacyEnum::NOBODY->value:
                break;
            default:
                break;
        }

        return $channels;
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
