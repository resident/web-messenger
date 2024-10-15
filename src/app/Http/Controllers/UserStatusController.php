<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ProfileService;
use Illuminate\Http\Request;

final class UserStatusController extends Controller
{
    public function __construct(
        public ProfileService $profileService,
    ) {}

    public function getUserStatus(Request $request, int $userId)
    {
        try {
            $authUser = $request->user();
            $userStatus = $this->profileService->getUserStatus($authUser, $userId);

            if (!$userStatus) {
                return response()->json(['error' => 'Access to the user status is forbidden']);
            }

            return response()->json($userStatus->toArray());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 500]);
        }
    }
}
