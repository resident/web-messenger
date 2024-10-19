<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class UserStatusController extends Controller
{
    public function getUserStatus(Request $request, int $userId, ProfileService $profileService): JsonResponse
    {
        $authUser = $request->user();
        $userStatus = $profileService->getUserStatus($authUser, $userId)
            or abort(403, 'Access to the user status is forbidden');

        return response()->json($userStatus->toArray());
    }

    public function getUsersStatus(Request $request, ProfileService $profileService)
    {
        $authUser = $request->user();
        $userIds = $request->input('user_ids', []);
        $userIds = array_map('intval', $userIds);
        $statuses = $profileService->getUsersStatus($authUser, $userIds);

        return response()->json($statuses);
    }
}
