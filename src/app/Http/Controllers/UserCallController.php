<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\MediaTypeEnum;
use App\Events\UserCall\CallEnded;
use App\Events\UserCall\IceCandidate;
use App\Events\UserCall\SdpDescription;
use App\Http\Requests\UserCall\IceCandidateRequest;
use App\Http\Requests\UserCall\SdpDescriptionRequest;
use App\Models\User;

final class UserCallController extends Controller
{
    public function sdpDescription(SdpDescriptionRequest $request, User $fromUser, User $toUser): void
    {
        $mediaType = $request->enum('media_type', MediaTypeEnum::class);
        $description = $request->get('description');
        $description['sdp'] .= "\n";

        broadcast(new SdpDescription($fromUser, $toUser, $mediaType, $description));
    }

    public function iceCandidate(IceCandidateRequest $request, User $user): void
    {
        broadcast(new IceCandidate($user, $request->get('candidate')));
    }

    public function endCall(User $user): void
    {
        broadcast(new CallEnded($user));
    }
}
