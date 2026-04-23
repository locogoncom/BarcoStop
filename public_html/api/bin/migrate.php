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

// Ajustes idempotentes para instalaciones antiguas.
$dbName = $pdo->query('SELECT DATABASE()')->fetchColumn();
if (is_string($dbName) && $dbName !== '') {
    $colStmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $ensureColumn = static function (string $table, string $column, string $ddl) use ($pdo, $colStmt, $dbName): void {
        $colStmt->execute([$dbName, $table, $column]);
        $exists = (int) $colStmt->fetchColumn() > 0;
        if (!$exists) {
            $pdo->exec($ddl);
        }
    };

    $ensureColumn(
        'donations',
        'currency',
        "ALTER TABLE donations ADD COLUMN currency VARCHAR(3) DEFAULT 'EUR' AFTER amount"
    );
    $ensureColumn(
        'donations',
        'updated_at',
        'ALTER TABLE donations ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
    );
}

echo "Schema aplicado correctamente.\n";
