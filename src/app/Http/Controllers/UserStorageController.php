<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Dto\UserStorageDto;
use App\Http\Requests\StoreUserStorageRequest;
use App\Http\Requests\UpdateUserStorageRequest;
use App\Models\UserStorage;
use App\Repositories\UserStorageRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

final class UserStorageController extends Controller
{
    public function __construct(private readonly UserStorageRepository $repository)
    {
    }

    private function get(string $id = null, string $key = null): ?UserStorage
    {
        $userStorage = null;

        if ($id !== null) {
            $userStorage = $this->repository->getById($id);
        } elseif ($key !== null) {
            $userStorage = $this->repository->getByKey(request()->user()->id, $key);
        }

        return $userStorage;
    }

    private function set(string $id = null, string $key = null, mixed $value = null): bool
    {
        $userStorage = $this->get($id, $key);

        if ($userStorage) {
            Gate::authorize('update', $userStorage);

            return $this->repository->setByModel($userStorage, $value);
        }

        Gate::authorize('create', UserStorage::class);

        $this->repository->create(UserStorageDto::fromArray([
            'user_id' => request()->user()->id,
            'key' => $key,
            'value' => $value,
        ]));

        return true;
    }

    private function delete(string $id = null, string $key = null): bool
    {
        $userStorage = $this->get($id, $key);

        if ($userStorage) {
            Gate::authorize('delete', $userStorage);

            return $this->repository->deleteByModel($userStorage);
        }

        return false;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        Gate::authorize('viewOwn', UserStorage::class);

        return response()->json($this->repository->getAll(request()->user()->id));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserStorageRequest $request): JsonResponse
    {
        Gate::authorize('create', UserStorage::class);

        return response()->json(
            $this->repository->create(
                UserStorageDto::fromArray([...$request->safe(), 'user_id' => request()->user()->id])
            )
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $userStorageId): JsonResponse
    {
        $userStorage = $this->get(id: $userStorageId);

        if ($userStorage) {
            Gate::authorize('view', $userStorage);

            return response()->json($userStorage);
        }

        return response()->json(null);
    }

    /**
     * Display the specified resource.
     */
    public function showByKey(string $userStorageKey): JsonResponse
    {
        $userStorage = $this->get(key: $userStorageKey);

        if ($userStorage) {
            Gate::authorize('view', $userStorage);

            return response()->json($userStorage);
        }

        return response()->json(null);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserStorageRequest $request, string $userStorageId): JsonResponse
    {
        return response()->json($this->set(id: $userStorageId, value: $request->validated('value')));
    }

    /**
     * Update the specified resource in storage.
     */
    public function updateByKey(UpdateUserStorageRequest $request, string $userStorageKey): JsonResponse
    {
        return response()->json($this->set(key: $userStorageKey, value: $request->validated('value')));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $userStorageId): JsonResponse
    {
        return response()->json($this->delete(id: $userStorageId));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroyByKey(string $userStorageKey): JsonResponse
    {
        return response()->json($this->delete(key: $userStorageKey));
    }
}
