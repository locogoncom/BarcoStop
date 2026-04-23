<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

use BarcoStop\ServerPhp\Config\Database;

abstract class BaseRepository
{
    protected function fetchAll(string $sql, array $params = []): array
    {
        return Database::fetchAll($sql, $params);
    }

    protected function fetchOne(string $sql, array $params = []): ?array
    {
        return Database::fetchOne($sql, $params);
    }

    protected function execute(string $sql, array $params = []): int
    {
        return Database::execute($sql, $params);
    }
}
