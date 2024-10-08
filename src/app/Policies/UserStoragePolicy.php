<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\UserStorage;

final class UserStoragePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view own models.
     */
    public function viewOwn(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, UserStorage $userStorage): bool
    {
        return $user->id === $userStorage->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, UserStorage $userStorage): bool
    {
        return $user->id === $userStorage->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, UserStorage $userStorage): bool
    {
        return $user->id === $userStorage->user_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, UserStorage $userStorage): bool
    {
        return $user->id === $userStorage->user_id;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, UserStorage $userStorage): bool
    {
        return $user->id === $userStorage->user_id;
    }
}
