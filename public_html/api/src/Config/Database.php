<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Config;

use PDO;
use PDOException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $host = AppConfig::env('DB_HOST', '127.0.0.1');
        $port = AppConfig::env('DB_PORT', '3306');
        $db = AppConfig::env('DB_NAME');
        $user = AppConfig::env('DB_USER');
        $pass = AppConfig::env('DB_PASSWORD');
        $charset = AppConfig::env('DB_CHARSET', 'utf8mb4');

        if (!$db || !$user || $pass === null) {
            throw new \RuntimeException('Faltan credenciales DB_*');
        }

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $db, $charset);

        try {
            self::$pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            throw new \RuntimeException('Error de conexion MySQL: ' . $e->getMessage(), 0, $e);
        }

        return self::$pdo;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function execute(string $sql, array $params = []): int
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }
}
