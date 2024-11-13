<?php

declare(strict_types=1);

namespace App\Services;

use App\Dto\ChatRoomMessageAttachmentDto;
use App\Dto\ChatRoomMessageDto;
use App\Enums\MessageStatusEnum;
use App\Models\ChatRoomMessage;
use App\Models\ChatRoomMessageSeen;
use App\Repositories\ChatRoomMessageRepository;
use Illuminate\Support\Facades\DB;

final readonly class ChatRoomMessageService
{
    public function __construct(
        public ChatRoomMessageRepository $repository,
        public ChatRoomMessageAttachmentService $attachmentService
    ) {}

    /**
     * @param ChatRoomMessageDto $messageDto
     * @param array<ChatRoomMessageAttachmentDto> $attachments
     * @return ChatRoomMessage
     */
    public function createMessageWithAttachments(
        ChatRoomMessageDto $messageDto,
        array $attachments
    ): ChatRoomMessage {
        return DB::transaction(function () use ($messageDto, $attachments) {
            $message = $this->repository->createMessage($messageDto);

            foreach ($attachments as $attachment) {
                $attachment->chatRoomMessageId = $message->id;

                $this->attachmentService->repository->createAttachment($attachment);
            }

            return $message;
        });
    }

    public function deleteMessage(ChatRoomMessage $message): ?bool
    {
        return DB::transaction(function () use ($message) {
            $this->attachmentService->deleteAttachments($message);
            return $this->repository->deleteMessage($message);
        });
    }

    public function updateMessageStatus(ChatRoomMessage $message, MessageStatusEnum $status): bool
    {
        if ($message->status !== $status) {
            return $this->repository->updateMessageStatus($message, $status);
        }
        return false;
    }

    public function markAsSeen(string $messageId, int $userId, bool $seen): ChatRoomMessageSeen
    {
        return $this->repository->createOrUpdateMessageSeen($messageId, $userId, $seen);
    }

    public function getSeenByUsers(string $messageId)
    {
        return $this->repository->getSeenByUsers($messageId);
    }
}
