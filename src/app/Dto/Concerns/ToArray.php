<?php

declare(strict_types=1);

namespace App\Dto\Concerns;

use Illuminate\Support\Str;
use ReflectionClass;
use ReflectionProperty;

trait ToArray
{
    private ?array $data = null;

    /**
     * Return all public fields as array
     *
     * @return array
     */
    public function toArray(): array
    {
        if ($this->data === null) {
            $reflection = new ReflectionClass($this);
            $properties = $reflection->getProperties(ReflectionProperty::IS_PUBLIC);

            $this->data = [];

            foreach ($properties as $property) {
                // skip optional fields if they are null
                if (!$property->hasDefaultValue()
                    && $property->getType()->allowsNull()
                    && $this->{$property->getName()} === null) {
                    continue;
                }

                $this->data[Str::snake($property->getName())] = &$this->{$property->getName()};
            }
        }

        return array_map(fn($v) => $v, $this->data);
    }
}
