<?php

declare(strict_types=1);

namespace App\Dto\Concerns;

use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionProperty;

trait FromArray
{
    public static function fromArray(array $data): static
    {
        $reflection = new ReflectionClass(static::class);
        $properties = $reflection->getProperties(ReflectionProperty::IS_PUBLIC);

        $params = [];

        foreach ($properties as $property) {
            $params[$property->getName()] = $data[$property->getName()]
                ?? $data[Str::snake($property->getName())]
                ?? null;
        }

        return new static(...$params);
    }
}
