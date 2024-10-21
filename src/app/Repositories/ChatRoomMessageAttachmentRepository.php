<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\ChatRoomMessageAttachmentDto;
use App\Models\ChatRoomMessageAttachment;
use Illuminate\Support\Collection;
use InvalidArgumentException;

final class ChatRoomMessageAttachmentRepository
{
    public function createAttachment(ChatRoomMessageAttachmentDto $attachmentDto): ChatRoomMessageAttachment
    {
        return ChatRoomMessageAttachment::unguarded(
            fn() => ChatRoomMessageAttachment::query()->create($attachmentDto->toArray())
        );
    }

    /**
     * @phpstan-param iterable<int|string, string|object|array<string>>|object|string $paths
     * @return Collection<string, int>
     */
    public function getAttachmentRefs(iterable|object|string $paths): Collection
    {
        $paths = is_iterable($paths) ? collect($paths) : collect()->push($paths);

        $paths->transform(function (mixed $item) {
            return match (true) {
                is_string($item) => $item,
                is_object($item) && isset($item->path) && is_string($item->path) => $item->path,
                is_array($item) && isset($item['path']) => $item['path'],

                default => throw new InvalidArgumentException('Invalid path'),
            };
        });

        return ChatRoomMessageAttachment::query()
            ->selectRaw('path, count(path) as count')
            ->whereIn('path', $paths->unique())
            ->groupBy('path')
            ->get()
            ->mapWithKeys(fn($ref) => [strval($ref->path) => intval($ref->count)])
            ->collect();
    }
}
