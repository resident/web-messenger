<?php

declare(strict_types=1);

namespace App\Dto\Concerns;

use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionProperty;

trait ToArray
{
    /**
     * Return all public fields as array
     *
     * @return array
     */
    public function toArray(): array
    {
        $reflection = new ReflectionClass($this);
        $properties = $reflection->getProperties(ReflectionProperty::IS_PUBLIC);

        $result = [];

        foreach ($properties as $property) {
            // skip optional fields if they are null
            if (!$property->hasDefaultValue()
                && $property->getType()->allowsNull()
                && $this->{$property->getName()} === null) {
                continue;
            }

            $result[Str::snake($property->getName())] = $this->{$property->getName()};
        }

        return $result;
    }
}
