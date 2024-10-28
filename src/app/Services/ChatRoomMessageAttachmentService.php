<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ChatRoomMessage;
use App\Models\ChatRoomMessageAttachment;
use App\Repositories\ChatRoomMessageAttachmentRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final readonly class ChatRoomMessageAttachmentService
{
    public function __construct(public ChatRoomMessageAttachmentRepository $repository)
    {
    }

    private function deleteAttachmentFile(ChatRoomMessageAttachment $attachment): bool
    {
        return Storage::delete($attachment->path);
    }

    public function deleteAttachment(ChatRoomMessageAttachment $attachment): ?bool
    {
        return DB::transaction(function () use ($attachment) {
            $this->deleteAttachmentFile($attachment);

            return $attachment->delete();
        });
    }

    public function deleteAttachments(ChatRoomMessage $message): int
    {
        return DB::transaction(function () use ($message) {
            /** @var Collection<int, ChatRoomMessageAttachment> $attachments */
            $attachments = $message->attachments()->get();

            $attachmentRefs = $this->repository->getAttachmentRefs($attachments);

            foreach ($attachments as $attachment) {
                if ($attachmentRefs->get($attachment->path) === 1) {
                    $this->deleteAttachmentFile($attachment);
                }
            }

            return $message->attachments()->delete();
        });
    }
}
