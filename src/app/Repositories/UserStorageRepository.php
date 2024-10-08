<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Dto\UserStorageDto;
use App\Models\UserStorage;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

final class UserStorageRepository
{
    public function getAll(int $userId): EloquentCollection
    {
        return UserStorage::query()->where('user_id', $userId)->get();
    }

    public function create(UserStorageDto $userStorageDto): UserStorage
    {
        return UserStorage::unguarded(fn() => UserStorage::query()->create($userStorageDto->toArray()));
    }

    public function getById(string $id): ?UserStorage
    {
        return UserStorage::query()->find($id);
    }

    public function getByKey(int $userId, string $key): ?UserStorage
    {
        return UserStorage::query()
            ->where('user_id', $userId)
            ->where('key', $key)
            ->first();
    }

    public function setByModel(UserStorage $userStorage, mixed $value): bool
    {
        $userStorage->value = $value;

        return $userStorage->save();
    }

    public function setById(string $id, mixed $value): bool
    {
        $userStorage = $this->getById($id);

        return $this->setByModel($userStorage, $value);
    }

    public function setByKey(int $userId, string $key, mixed $value): bool
    {
        $userStorage = $this->getByKey($userId, $key) ?? new UserStorage();

        return $this->setByModel($userStorage, $value);
    }

    public function deleteByModel(UserStorage $userStorage): bool
    {
        return $userStorage->delete();
    }

    public function deleteById(string $id): ?bool
    {
        return UserStorage::query()->find($id)?->delete();
    }

    public function deleteByKey(int $userId, string $key): bool
    {
        return (bool)UserStorage::query()->where('user_id', $userId)->where('key', $key)->delete();
    }
}
