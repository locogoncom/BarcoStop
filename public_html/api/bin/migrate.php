<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Config\Database;
use Dotenv\Dotenv;

require dirname(__DIR__) . '/vendor/autoload.php';

$envPath = dirname(__DIR__);
if (file_exists($envPath . '/.env')) {
    Dotenv::createImmutable($envPath)->safeLoad();
}

$sql = file_get_contents(dirname(__DIR__) . '/database/schema.sql');
if ($sql === false) {
    throw new RuntimeException('No se pudo leer schema.sql');
}

$pdo = Database::pdo();
$pdo->exec($sql);

echo "Schema aplicado correctamente.\n";
