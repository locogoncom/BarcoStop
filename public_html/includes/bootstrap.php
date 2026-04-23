<?php

declare(strict_types=1);

function siteLoadEnvFile(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$keyRaw, $valueRaw] = explode('=', $trimmed, 2);
        $key = trim($keyRaw);
        if ($key === '') {
            continue;
        }

        if (getenv($key) !== false) {
            continue;
        }

        $value = trim($valueRaw);
        $quoted = strlen($value) >= 2
            && (($value[0] === '"' && $value[strlen($value) - 1] === '"')
                || ($value[0] === "'" && $value[strlen($value) - 1] === "'"));
        if ($quoted) {
            $value = substr($value, 1, -1);
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

siteLoadEnvFile(dirname(__DIR__, 2) . '/.env');
siteLoadEnvFile(dirname(__DIR__, 2) . '/server_php/.env');

function siteEnv(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return (string) $value;
}

/**
 * @return array{pdo: ?\PDO, error: ?string}
 */
function siteDbState(): array
{
    static $state = null;
    if (is_array($state)) {
        return $state;
    }

    $host = siteEnv('DB_HOST', '127.0.0.1');
    $port = siteEnv('DB_PORT', '3306');
    $db = siteEnv('DB_NAME');
    $user = siteEnv('DB_USER');
    $password = siteEnv('DB_PASSWORD');
    $charset = siteEnv('DB_CHARSET', 'utf8mb4');

    if ($db === null || $user === null || $password === null) {
        $state = [
            'pdo' => null,
            'error' => 'Faltan variables DB_NAME, DB_USER o DB_PASSWORD para cargar estadisticas.',
        ];
        return $state;
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $db, $charset);

    try {
        $pdo = new \PDO($dsn, $user, $password, [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $state = ['pdo' => $pdo, 'error' => null];
    } catch (\PDOException $e) {
        $state = ['pdo' => null, 'error' => 'No se pudo conectar con la base de datos.'];
    }

    return $state;
}

function siteDb(): ?\PDO
{
    $state = siteDbState();
    return $state['pdo'];
}

function siteDbError(): ?string
{
    $state = siteDbState();
    return $state['error'];
}

/**
 * @return array{
 *   totalUsers: int,
 *   totalTrips: int,
 *   latestTrips: array<int, array<string, mixed>>,
 *   dbConnected: bool,
 *   dbError: ?string
 * }
 */
function siteHomeMetrics(): array
{
    $pdo = siteDb();
    if (!$pdo) {
        return [
            'totalUsers' => 0,
            'totalTrips' => 0,
            'latestTrips' => [],
            'dbConnected' => false,
            'dbError' => siteDbError(),
        ];
    }

    try {
        $totalUsers = (int) ($pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() ?: 0);
        $totalTrips = (int) ($pdo->query('SELECT COUNT(*) FROM trips')->fetchColumn() ?: 0);

        $latestTripsStmt = $pdo->query(
            'SELECT
                t.id,
                t.origin,
                t.destination,
                t.departure_date,
                t.departure_time,
                t.available_seats,
                t.cost,
                t.status,
                t.created_at,
                u.name AS patron_name
            FROM trips t
            LEFT JOIN users u ON u.id = t.patron_id
            ORDER BY t.created_at DESC
            LIMIT 6'
        );
    } catch (\Throwable $e) {
        return [
            'totalUsers' => 0,
            'totalTrips' => 0,
            'latestTrips' => [],
            'dbConnected' => false,
            'dbError' => 'No se pudieron leer las tablas necesarias para la home.',
        ];
    }

    $latestTrips = [];
    if ($latestTripsStmt !== false) {
        foreach ($latestTripsStmt->fetchAll() as $row) {
            $latestTrips[] = [
                'id' => (string) ($row['id'] ?? ''),
                'origin' => (string) ($row['origin'] ?? ''),
                'destination' => (string) ($row['destination'] ?? ''),
                'departureDate' => (string) ($row['departure_date'] ?? ''),
                'departureTime' => (string) ($row['departure_time'] ?? ''),
                'availableSeats' => (int) ($row['available_seats'] ?? 0),
                'cost' => (float) ($row['cost'] ?? 0),
                'status' => (string) ($row['status'] ?? 'active'),
                'captainName' => (string) ($row['patron_name'] ?? 'Capitan'),
                'createdAt' => (string) ($row['created_at'] ?? ''),
            ];
        }
    }

    return [
        'totalUsers' => $totalUsers,
        'totalTrips' => $totalTrips,
        'latestTrips' => $latestTrips,
        'dbConnected' => true,
        'dbError' => null,
    ];
}

function siteFormatTripDate(string $date, string $time): string
{
    if ($date === '') {
        return 'Fecha pendiente';
    }

    $timePart = $time !== '' ? $time : '00:00:00';
    $candidate = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $timePart);
    if (!$candidate) {
        return $date . ($time !== '' ? (' ' . $time) : '');
    }

    return $candidate->format('d/m/Y H:i');
}

function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}
