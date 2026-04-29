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
    $ensureColumn(
        'users',
        'current_location',
        'ALTER TABLE users ADD COLUMN current_location VARCHAR(255) AFTER bio'
    );
    $ensureColumn(
        'users',
        'instagram',
        'ALTER TABLE users ADD COLUMN instagram VARCHAR(255) AFTER current_location'
    );
    $ensureColumn(
        'users',
        'phone',
        'ALTER TABLE users ADD COLUMN phone VARCHAR(50) AFTER instagram'
    );
    $ensureColumn(
        'users',
        'languages',
        'ALTER TABLE users ADD COLUMN languages VARCHAR(255) AFTER phone'
    );
    $ensureColumn(
        'users',
        'sailing_experience',
        'ALTER TABLE users ADD COLUMN sailing_experience VARCHAR(255) AFTER languages'
    );
    $ensureColumn(
        'users',
        'certifications',
        'ALTER TABLE users ADD COLUMN certifications VARCHAR(255) AFTER sailing_experience'
    );
    $ensureColumn(
        'users',
        'preferred_routes',
        'ALTER TABLE users ADD COLUMN preferred_routes VARCHAR(255) AFTER certifications'
    );
    $ensureColumn(
        'users',
        'boat_model',
        'ALTER TABLE users ADD COLUMN boat_model VARCHAR(255) AFTER boat_type'
    );
    $ensureColumn(
        'users',
        'boat_length_m',
        'ALTER TABLE users ADD COLUMN boat_length_m DECIMAL(5,2) AFTER boat_model'
    );
    $ensureColumn(
        'users',
        'home_port',
        'ALTER TABLE users ADD COLUMN home_port VARCHAR(255) AFTER boat_length_m'
    );
    $ensureColumn(
        'users',
        'captain_license',
        'ALTER TABLE users ADD COLUMN captain_license VARCHAR(255) AFTER home_port'
    );
    $ensureColumn(
        'users',
        'boat_capacity',
        'ALTER TABLE users ADD COLUMN boat_capacity INT AFTER boat_length_m'
    );
    $ensureColumn(
        'users',
        'boat_year',
        'ALTER TABLE users ADD COLUMN boat_year VARCHAR(10) AFTER boat_capacity'
    );
    $ensureColumn(
        'users',
        'boat_license',
        'ALTER TABLE users ADD COLUMN boat_license VARCHAR(255) AFTER boat_year'
    );
    $ensureColumn(
        'users',
        'boat_photo_1',
        'ALTER TABLE users ADD COLUMN boat_photo_1 VARCHAR(500) AFTER boat_license'
    );
    $ensureColumn(
        'users',
        'boat_photo_2',
        'ALTER TABLE users ADD COLUMN boat_photo_2 VARCHAR(500) AFTER boat_photo_1'
    );
    $ensureColumn(
        'users',
        'boat_photo_3',
        'ALTER TABLE users ADD COLUMN boat_photo_3 VARCHAR(500) AFTER boat_photo_2'
    );
    $ensureColumn(
        'trips',
        'trip_meta',
        'ALTER TABLE trips ADD COLUMN trip_meta LONGTEXT AFTER description'
    );
    $ensureColumn(
        'boats',
        'photos',
        'ALTER TABLE boats ADD COLUMN photos JSON AFTER safety_equipment'
    );
}

echo "Schema aplicado correctamente.\n";
