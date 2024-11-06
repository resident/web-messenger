<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\UserDeleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;

class DeleteUserFiles implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(UserDeleted $event): void
    {
        $directory = 'attachments/' . $event->user->id;
        
        if($event->user->avatar){
            Storage::delete("public/avatars/{$event->user->avatar->path}");
        }

        if (Storage::directoryExists($directory)) {
            Storage::deleteDirectory($directory);
        }
    }
}
