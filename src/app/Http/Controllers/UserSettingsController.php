<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserSettingsRequest;
use App\Repositories\UserSettingsRepository;
use Illuminate\Http\JsonResponse;

final class UserSettingsController extends Controller
{
    /**
     * Display the specified resource.
     */
    public function get(UserSettingsRepository $repository): JsonResponse
    {
        $user = request()->user();

        return response()->json($repository->getUserSettingsByUserId($user->id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserSettingsRequest $request, UserSettingsRepository $repository): JsonResponse
    {
        $user = request()->user();
        $settings = $request->validated();

        return response()->json($repository->updateUserSettings($user->id, $settings));
    }
}
