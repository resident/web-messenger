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

        $defaults = [];

        foreach ($properties as $property) {
            if (!$property->hasDefaultValue() && $property->getType()->allowsNull()) {
                $defaults[$property->getName()] = null;
            }
        }

        $params = [...$defaults, ...array_combine(array_map(Str::camel(...), array_keys($data)), array_values($data))];

        return new static(...$params);
    }
}
