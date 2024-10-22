<?php

declare(strict_types=1);

namespace App\Events;

use App\Dto\UserStatusDto;
use App\Enums\VisibilityPrivacyEnum;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Repositories\UserSettingsRepository;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

final class UserOnlineStatusChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public UserStatusDto $userStatus;
    private UserRepository $userRepository;
    private UserSettingsRepository $userSettingsRepository;

    private User $user;
    private array $channels = [];

    /**
     * Create a new event instance.
     */
    public function __construct(UserStatusDto $userStatus)
    {
        $this->userStatus = $userStatus;
        $this->userRepository = app(UserRepository::class);
        $this->userSettingsRepository = app(UserSettingsRepository::class);
    }

    private function fillChannelsForEveryone(): void
    {
        $chatRoomIds = $this->user->chatRooms()->pluck('chat_rooms.id')->toArray();

        foreach ($chatRoomIds as $chatRoomId) {
            $this->channels[] = new PrivateChannel("chat-room.$chatRoomId");
        }
    }

    private function fillChannelsForContacts(): void
    {
        Log::debug("Not implemented yet.");
        /*$contacts = $this->user->contacts()->pluck('id')->toArray();

        foreach ($contacts as $contactId) {
            $this->channels[] = new PrivateChannel("user-status.$contactId");
        }

        $chatRooms = $this->user->chatRooms()
            ->whereDoesntHave('users', function ($query) use ($contacts) {
                $query->whereNotIn('users.id', $contacts);
            })->pluck('id')->toArray();

        foreach ($chatRooms as $chatRoomId) {
            $this->channels[] = new PrivateChannel("chat-room.$chatRoomId");
        }*/
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        try {
            $userId = $this->userStatus->user_id;
            $this->user = $this->userRepository->getUserById($this->userStatus->user_id);

            if (!$this->user) {
                return [];
            }

            $userSettings = $this->userSettingsRepository->getUserSettingsByUserId($userId);

            switch ($userSettings->status_visibility) {
                case VisibilityPrivacyEnum::EVERYONE:
                    $this->fillChannelsForEveryone();
                    break;
                case VisibilityPrivacyEnum::CONTACTS:
                    $this->fillChannelsForContacts();
                    break;
                case VisibilityPrivacyEnum::NOBODY:
                    break;
                default:
                    Log::debug("Invalid Visibility Privacy Enum");
                    break;
            }
        } catch (Throwable $exception) {
            Log::error($exception->getMessage(), ['trace' => $exception->getTraceAsString()]);
        }

        return $this->channels;
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
