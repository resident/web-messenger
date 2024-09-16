<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\UserDto;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class UserRepository
{
    /**
     * @return Collection<int, User>
     */
    public function getAllUsers(): Collection
    {
        return User::all();
    }

    public function getUserById(int $id): User
    {
        return User::query()->find($id);
    }

    /**
     * @param array<int> $ids
     * @return Collection<int, User>
     */
    public function getUsersById(array $ids): Collection
    {
        return User::query()->whereIn('id', $ids)->get();
    }

    /**
     * @param array<string> $userNames
     * @return Collection<int, User>
     */
    public function getUsersByName(array $userNames): Collection
    {
        return User::query()->whereIn('name', $userNames)->get();
    }

    public function createUser(UserDto $userDto): User
    {
        return User::query()->create($userDto->toArray());
    }
}
