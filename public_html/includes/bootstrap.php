<?php

declare(strict_types=1);

/**
 * @return array<string, mixed>
 */
function siteWebsiteConfig(): array
{
    static $config = null;
    if (is_array($config)) {
        return $config;
    }

    $configPath = dirname(__DIR__, 1) . '/config.php';
    if (is_file($configPath) && is_readable($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $config = $loaded;
            return $config;
        }
    }

    $config = [];
    return $config;
}

function siteEnv(string $key, ?string $default = null): ?string
{
    $config = siteWebsiteConfig();
    if (array_key_exists($key, $config)) {
        $configured = $config[$key];
        if ($configured !== null && $configured !== '') {
            return (string) $configured;
        }
    }

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

function siteApiBaseUrl(): string
{
    $configured = trim((string) siteEnv('WEBSITE_API_BASE', ''));
    if ($configured !== '') {
        return rtrim($configured, '/');
    }

    return 'https://api.barcostop.net/api/v1';
}

function siteApiOrigin(): string
{
    $base = siteApiBaseUrl();
    $parts = parse_url($base);
    if (!is_array($parts) || empty($parts['host'])) {
        return 'https://api.barcostop.net';
    }
    $scheme = (string) ($parts['scheme'] ?? 'https');
    $host = (string) $parts['host'];
    $port = isset($parts['port']) ? (int) $parts['port'] : null;
    if ($port !== null && $port > 0) {
        return $scheme . '://' . $host . ':' . $port;
    }
    return $scheme . '://' . $host;
}

/**
 * @return array{plain:string,meta:array<string,mixed>}
 */
function siteParseTripDescription(string $raw): array
{
    $description = trim($raw);
    $meta = [];

    $marker = "\n[BSMETA]";
    $pos = strpos($description, $marker);
    if ($pos === false) {
        return ['plain' => $description, 'meta' => $meta];
    }

    $plain = trim(substr($description, 0, $pos));
    $metaRaw = trim(substr($description, $pos + strlen($marker)));
    if ($metaRaw !== '') {
        $decoded = json_decode($metaRaw, true);
        if (is_array($decoded)) {
            $meta = $decoded;
        }
    }

    return ['plain' => $plain, 'meta' => $meta];
}

function siteResolveTripImageUrl(string $value): string
{
    $url = trim($value);
    if ($url === '') {
        return '';
    }
    if (preg_match('#^https?://#i', $url) === 1) {
        return $url;
    }
    if (str_starts_with($url, '/uploads/')) {
        return siteApiOrigin() . $url;
    }
    if (str_starts_with($url, 'uploads/')) {
        return siteApiOrigin() . '/' . $url;
    }
    if (str_starts_with($url, '/')) {
        return siteApiOrigin() . $url;
    }
    return siteApiOrigin() . '/' . $url;
}

function siteTripImageUrl(array $trip): string
{
    $description = (string) ($trip['description'] ?? '');
    $parsed = siteParseTripDescription($description);
    $meta = $parsed['meta'];
    $metaUrl = is_array($meta) ? (string) ($meta['boatImageUrl'] ?? '') : '';
    $directUrl = (string) ($trip['boatImageUrl'] ?? '');

    $resolved = siteResolveTripImageUrl($metaUrl !== '' ? $metaUrl : $directUrl);
    if ($resolved !== '') {
        return $resolved;
    }

    return 'assets/logo-barcostop-header.png';
}

/**
 * @return array<mixed>|null
 */
function siteFetchApiJsonArray(string $path): ?array
{
    $url = siteApiBaseUrl() . '/' . ltrim($path, '/');
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 4,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\n",
        ],
    ]);

    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return null;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

/**
 * @return array{
 *   totalUsers: int,
 *   totalTrips: int,
 *   latestTrips: array<int, array<string, mixed>>,
 *   dbConnected: bool,
 *   dbError: ?string
 * }|null
 */
function siteHomeMetricsFromApi(): ?array
{
    $trips = siteFetchApiJsonArray('/trips');
    if (!is_array($trips)) {
        return null;
    }

    $users = siteFetchApiJsonArray('/users');
    $totalUsers = is_array($users) ? count($users) : 0;
    $totalTrips = count($trips);

    usort($trips, static function ($a, $b): int {
        $aCreated = is_array($a) ? (string) ($a['createdAt'] ?? $a['created_at'] ?? '') : '';
        $bCreated = is_array($b) ? (string) ($b['createdAt'] ?? $b['created_at'] ?? '') : '';
        return strcmp($bCreated, $aCreated);
    });

    $latestTrips = [];
    foreach (array_slice($trips, 0, 6) as $trip) {
        if (!is_array($trip)) {
            continue;
        }

        $latestTrips[] = [
            'id' => (string) ($trip['id'] ?? ''),
            'origin' => (string) ($trip['origin'] ?? ''),
            'destination' => (string) ($trip['destination'] ?? ''),
            'departureDate' => (string) ($trip['departureDate'] ?? $trip['departure_date'] ?? ''),
            'departureTime' => (string) ($trip['departureTime'] ?? $trip['departure_time'] ?? ''),
            'availableSeats' => (int) ($trip['availableSeats'] ?? $trip['available_seats'] ?? 0),
            'cost' => (float) ($trip['cost'] ?? 0),
            'description' => (string) ($trip['description'] ?? ''),
            'status' => (string) ($trip['status'] ?? 'active'),
            'captainName' => (string) ($trip['patronName'] ?? $trip['captainName'] ?? 'Capitan'),
            'createdAt' => (string) ($trip['createdAt'] ?? $trip['created_at'] ?? ''),
        ];
    }

    return [
        'totalUsers' => $totalUsers,
        'totalTrips' => $totalTrips,
        'latestTrips' => $latestTrips,
        'dbConnected' => false,
        'dbError' => siteDbError(),
    ];
}

/**
 * @return array<string,mixed>|null
 */
function siteTripByIdFromApi(string $tripId): ?array
{
    $tripId = trim($tripId);
    if ($tripId === '') {
        return null;
    }

    $url = siteApiBaseUrl() . '/trips/' . rawurlencode($tripId);
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 4,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\n",
        ],
    ]);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return null;
    }
    $trip = json_decode($raw, true);
    if (!is_array($trip) || empty($trip['id'])) {
        return null;
    }

    $captain = is_array($trip['patron'] ?? null) ? $trip['patron'] : [];
    return [
        'id' => (string) ($trip['id'] ?? ''),
        'origin' => (string) ($trip['origin'] ?? ''),
        'destination' => (string) ($trip['destination'] ?? ''),
        'departureDate' => (string) ($trip['departureDate'] ?? ''),
        'departureTime' => (string) ($trip['departureTime'] ?? ''),
        'estimatedDuration' => (string) ($trip['estimatedDuration'] ?? ''),
        'description' => (string) ($trip['description'] ?? ''),
        'availableSeats' => (int) ($trip['availableSeats'] ?? 0),
        'cost' => (float) ($trip['cost'] ?? 0),
        'status' => (string) ($trip['status'] ?? 'active'),
        'createdAt' => (string) ($trip['createdAt'] ?? ''),
        'updatedAt' => (string) ($trip['updatedAt'] ?? ''),
        'captain' => [
            'id' => (string) ($captain['id'] ?? ''),
            'name' => (string) ($captain['name'] ?? 'Capitan'),
            'bio' => (string) ($captain['bio'] ?? ''),
            'boatName' => (string) ($captain['boatName'] ?? ''),
            'boatType' => (string) ($captain['boatType'] ?? ''),
            'boatModel' => (string) ($captain['boatModel'] ?? ''),
            'homePort' => (string) ($captain['homePort'] ?? ''),
            'instagram' => (string) ($captain['instagram'] ?? ''),
        ],
    ];
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
        $apiMetrics = siteHomeMetricsFromApi();
        if (is_array($apiMetrics)) {
            return $apiMetrics;
        }

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
                t.description,
                t.status,
                t.created_at,
                u.name AS patron_name
            FROM trips t
            LEFT JOIN users u ON u.id = t.patron_id
            ORDER BY t.created_at DESC
            LIMIT 6'
        );
    } catch (\Throwable $e) {
        $apiMetrics = siteHomeMetricsFromApi();
        if (is_array($apiMetrics)) {
            return $apiMetrics;
        }

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
                'description' => (string) ($row['description'] ?? ''),
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

/**
 * @return array<string,mixed>|null
 */
function siteTripById(string $tripId): ?array
{
    $tripId = trim($tripId);
    if ($tripId === '') {
        return null;
    }

    $pdo = siteDb();
    if (!$pdo) {
        return siteTripByIdFromApi($tripId);
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT
                t.id,
                t.origin,
                t.destination,
                t.departure_date,
                t.departure_time,
                t.estimated_duration,
                t.description,
                t.available_seats,
                t.cost,
                t.status,
                t.created_at,
                t.updated_at,
                u.id AS captain_id,
                u.name AS captain_name,
                u.bio AS captain_bio,
                u.boat_name,
                u.boat_type,
                u.boat_model,
                u.home_port,
                u.instagram
            FROM trips t
            LEFT JOIN users u ON u.id = t.patron_id
            WHERE t.id = ?
            LIMIT 1'
        );
        $stmt->execute([$tripId]);
        $row = $stmt->fetch();
    } catch (\Throwable $e) {
        // Backward-compatible query for older production schemas (missing optional user columns).
        try {
            $stmt = $pdo->prepare(
                'SELECT
                    t.id,
                    t.origin,
                    t.destination,
                    t.departure_date,
                    t.departure_time,
                    t.estimated_duration,
                    t.description,
                    t.available_seats,
                    t.cost,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    u.id AS captain_id,
                    u.name AS captain_name,
                    u.bio AS captain_bio
                FROM trips t
                LEFT JOIN users u ON u.id = t.patron_id
                WHERE t.id = ?
                LIMIT 1'
            );
            $stmt->execute([$tripId]);
            $row = $stmt->fetch();
        } catch (\Throwable $ignored) {
            return siteTripByIdFromApi($tripId);
        }
    }
    if (!is_array($row)) {
        return siteTripByIdFromApi($tripId);
    }

    return [
        'id' => (string) ($row['id'] ?? ''),
        'origin' => (string) ($row['origin'] ?? ''),
        'destination' => (string) ($row['destination'] ?? ''),
        'departureDate' => (string) ($row['departure_date'] ?? ''),
        'departureTime' => (string) ($row['departure_time'] ?? ''),
        'estimatedDuration' => (string) ($row['estimated_duration'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'availableSeats' => (int) ($row['available_seats'] ?? 0),
        'cost' => (float) ($row['cost'] ?? 0),
        'status' => (string) ($row['status'] ?? 'active'),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
        'captain' => [
            'id' => (string) ($row['captain_id'] ?? ''),
            'name' => (string) ($row['captain_name'] ?? 'Capitan'),
            'bio' => (string) ($row['captain_bio'] ?? ''),
            'boatName' => (string) ($row['boat_name'] ?? ''),
            'boatType' => (string) ($row['boat_type'] ?? ''),
            'boatModel' => (string) ($row['boat_model'] ?? ''),
            'homePort' => (string) ($row['home_port'] ?? ''),
            'instagram' => (string) ($row['instagram'] ?? ''),
        ],
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

function siteUuidV4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20, 12)
    );
}

/**
 * @return array{ok:bool,message:string,userId?:string,tripId?:string}
 */
function siteCreateCaptainWithTrip(array $input): array
{
    $pdo = siteDb();
    if (!$pdo) {
        return ['ok' => false, 'message' => 'Base de datos no disponible en este momento.'];
    }

    $name = trim((string) ($input['name'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $password = trim((string) ($input['password'] ?? ''));
    $boatName = trim((string) ($input['boat_name'] ?? ''));
    $boatType = trim((string) ($input['boat_type'] ?? ''));
    $origin = trim((string) ($input['origin'] ?? ''));
    $destination = trim((string) ($input['destination'] ?? ''));
    $departureDate = trim((string) ($input['departure_date'] ?? ''));
    $departureTime = trim((string) ($input['departure_time'] ?? '10:00:00'));
    $seats = max(1, (int) ($input['available_seats'] ?? 1));
    $cost = max(0.0, (float) ($input['cost'] ?? 0));
    $description = trim((string) ($input['description'] ?? ''));

    if ($name === '' || $email === '' || $password === '' || $boatName === '' || $origin === '' || $destination === '' || $departureDate === '') {
        return ['ok' => false, 'message' => 'Faltan campos obligatorios del formulario.'];
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Email invalido.'];
    }
    if (strlen($password) < 4) {
        return ['ok' => false, 'message' => 'La contraseña debe tener al menos 4 caracteres.'];
    }

    $exists = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $exists->execute([$email]);
    if ($exists->fetch()) {
        return ['ok' => false, 'message' => 'Ya existe una cuenta con ese email.'];
    }

    $userId = siteUuidV4();
    $tripId = siteUuidV4();
    $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

    try {
        $pdo->beginTransaction();

        $insertUser = $pdo->prepare(
            'INSERT INTO users
             (id, name, email, password, role, boat_name, boat_type, created_at, updated_at)
             VALUES (?, ?, ?, ?, "patron", ?, ?, NOW(), NOW())'
        );
        $insertUser->execute([$userId, $name, $email, $hashed, $boatName, $boatType]);

        $insertBoat = $pdo->prepare(
            'INSERT INTO boats
             (id, patron_id, name, type, capacity, length, year_built, fuel_type, license_number, safety_equipment, description, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, "active", NOW(), NOW())'
        );
        $insertBoat->execute([
            siteUuidV4(),
            $userId,
            $boatName,
            $boatType,
            $seats,
            json_encode([], JSON_UNESCAPED_UNICODE),
            'Boat registered from captain web form',
        ]);

        $insertTrip = $pdo->prepare(
            'INSERT INTO trips
             (id, patron_id, origin, destination, departure_date, departure_time, estimated_duration, description, available_seats, cost, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "active", NOW(), NOW())'
        );
        $insertTrip->execute([
            $tripId,
            $userId,
            $origin,
            $destination,
            $departureDate,
            $departureTime,
            '',
            $description,
            $seats,
            $cost,
        ]);

        $pdo->commit();
        return [
            'ok' => true,
            'message' => 'Alta completada. Ya tienes cuenta de capitan y tu primer viaje publicado.',
            'userId' => $userId,
            'tripId' => $tripId,
        ];
    } catch (\Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        return ['ok' => false, 'message' => 'No se pudo completar el alta ahora mismo.'];
    }
}

function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * @return array<string, array{slug:string,title:string,label:string,url:string,source:string}>
 */
function siteMarkdownDocuments(): array
{
    static $documents = null;
    if (is_array($documents)) {
        return $documents;
    }

    $root = dirname(__DIR__, 2);
    $documents = [
        'privacy-policy-es' => [
            'slug' => 'privacy-policy-es',
            'title' => 'Politica de Privacidad (ES)',
            'label' => 'Politica de Privacidad (ES)',
            'url' => 'docs/privacy-policy-es.html',
            'source' => $root . '/mobile/PRIVACY_POLICY_ES.md',
        ],
        'privacy-policy-en' => [
            'slug' => 'privacy-policy-en',
            'title' => 'Privacy Policy (EN)',
            'label' => 'Privacy Policy (EN)',
            'url' => 'docs/privacy-policy-en.html',
            'source' => $root . '/mobile/PRIVACY_POLICY_EN.md',
        ],
        'privacy-security' => [
            'slug' => 'privacy-security',
            'title' => 'Privacidad y Seguridad',
            'label' => 'Privacidad y Seguridad',
            'url' => 'docs/privacy-security.html',
            'source' => $root . '/mobile/PRIVACY_SECURITY.md',
        ],
        'play-console-data-safety' => [
            'slug' => 'play-console-data-safety',
            'title' => 'Play Console Data Safety',
            'label' => 'Play Console Data Safety',
            'url' => 'docs/play-console-data-safety.html',
            'source' => $root . '/mobile/PLAY_CONSOLE_DATA_SAFETY.md',
        ],
    ];

    return $documents;
}

/**
 * @return array{slug:string,title:string,label:string,url:string,source:string}|null
 */
function siteMarkdownDocument(string $slug): ?array
{
    $documents = siteMarkdownDocuments();
    return $documents[$slug] ?? null;
}

function siteMarkdownInline(string $text): string
{
    $escaped = h($text);

    $codeTokens = [];
    $withCodeTokens = preg_replace_callback(
        '/`([^`]+)`/',
        static function (array $matches) use (&$codeTokens): string {
            $token = '__CODE_TOKEN_' . count($codeTokens) . '__';
            $codeTokens[$token] = '<code>' . $matches[1] . '</code>';
            return $token;
        },
        $escaped
    );
    $escaped = is_string($withCodeTokens) ? $withCodeTokens : $escaped;

    $linked = preg_replace_callback(
        '/\[(.+?)\]\(([^)\s]+)\)/',
        static function (array $matches): string {
            $label = $matches[1];
            $url = html_entity_decode($matches[2], ENT_QUOTES, 'UTF-8');
            if (preg_match('#^(https?://|mailto:)#i', $url) !== 1) {
                return $matches[0];
            }

            return '<a href="' . h($url) . '" target="_blank" rel="noopener noreferrer">' . $label . '</a>';
        },
        $escaped
    );
    $escaped = is_string($linked) ? $linked : $escaped;

    $strong = preg_replace('/\*\*([^*]+)\*\*/', '<strong>$1</strong>', $escaped);
    $escaped = is_string($strong) ? $strong : $escaped;

    $emStar = preg_replace('/\*([^*\n]+)\*/', '<em>$1</em>', $escaped);
    $escaped = is_string($emStar) ? $emStar : $escaped;

    if ($codeTokens !== []) {
        $escaped = strtr($escaped, $codeTokens);
    }

    return $escaped;
}

function siteMarkdownToHtml(string $markdown): string
{
    $normalized = str_replace(["\r\n", "\r"], "\n", $markdown);
    $lines = explode("\n", $normalized);

    $html = [];
    $paragraph = [];
    $codeLines = [];
    $inCode = false;
    $inUl = false;
    $inOl = false;
    $inBlockquote = false;
    $codeLanguage = '';

    $closeLists = static function () use (&$html, &$inUl, &$inOl): void {
        if ($inUl) {
            $html[] = '</ul>';
            $inUl = false;
        }
        if ($inOl) {
            $html[] = '</ol>';
            $inOl = false;
        }
    };

    $closeBlockquote = static function () use (&$html, &$inBlockquote): void {
        if ($inBlockquote) {
            $html[] = '</blockquote>';
            $inBlockquote = false;
        }
    };

    $flushParagraph = static function () use (&$html, &$paragraph): void {
        if ($paragraph === []) {
            return;
        }

        $text = trim(implode(' ', $paragraph));
        $paragraph = [];
        if ($text === '') {
            return;
        }

        $html[] = '<p>' . siteMarkdownInline($text) . '</p>';
    };

    foreach ($lines as $rawLine) {
        $line = rtrim($rawLine);
        $trimmed = trim($line);

        if (preg_match('/^```([a-zA-Z0-9_+-]*)\s*$/', $trimmed, $codeMatch) === 1) {
            $flushParagraph();
            $closeLists();
            $closeBlockquote();
            if (!$inCode) {
                $inCode = true;
                $codeLines = [];
                $codeLanguage = $codeMatch[1] ?? '';
            } else {
                $languageAttr = $codeLanguage !== '' ? ' class="language-' . h($codeLanguage) . '"' : '';
                $html[] = '<pre><code' . $languageAttr . '>' . h(implode("\n", $codeLines)) . '</code></pre>';
                $inCode = false;
                $codeLines = [];
                $codeLanguage = '';
            }
            continue;
        }

        if ($inCode) {
            $codeLines[] = $line;
            continue;
        }

        if ($trimmed === '') {
            $flushParagraph();
            $closeLists();
            $closeBlockquote();
            continue;
        }

        if (preg_match('/^(#{1,6})\s+(.*)$/', $trimmed, $headingMatch) === 1) {
            $flushParagraph();
            $closeLists();
            $closeBlockquote();
            $level = strlen($headingMatch[1]);
            $html[] = '<h' . $level . '>' . siteMarkdownInline($headingMatch[2]) . '</h' . $level . '>';
            continue;
        }

        if (preg_match('/^>\s?(.*)$/', $trimmed, $quoteMatch) === 1) {
            $flushParagraph();
            $closeLists();
            if (!$inBlockquote) {
                $html[] = '<blockquote>';
                $inBlockquote = true;
            }
            $html[] = '<p>' . siteMarkdownInline($quoteMatch[1]) . '</p>';
            continue;
        }
        $closeBlockquote();

        if (preg_match('/^[-*]\s+\[([ xX])\]\s+(.*)$/', $trimmed, $checkMatch) === 1) {
            $flushParagraph();
            if ($inOl) {
                $html[] = '</ol>';
                $inOl = false;
            }
            if (!$inUl) {
                $html[] = '<ul>';
                $inUl = true;
            }
            $checked = strtolower($checkMatch[1]) === 'x';
            $html[] = '<li class="check-item"><input type="checkbox" disabled ' . ($checked ? 'checked' : '') . '> '
                . siteMarkdownInline($checkMatch[2]) . '</li>';
            continue;
        }

        if (preg_match('/^\d+\.\s+(.*)$/', $trimmed, $orderedMatch) === 1) {
            $flushParagraph();
            if ($inUl) {
                $html[] = '</ul>';
                $inUl = false;
            }
            if (!$inOl) {
                $html[] = '<ol>';
                $inOl = true;
            }
            $html[] = '<li>' . siteMarkdownInline($orderedMatch[1]) . '</li>';
            continue;
        }

        if (preg_match('/^[-*]\s+(.*)$/', $trimmed, $unorderedMatch) === 1) {
            $flushParagraph();
            if ($inOl) {
                $html[] = '</ol>';
                $inOl = false;
            }
            if (!$inUl) {
                $html[] = '<ul>';
                $inUl = true;
            }
            $html[] = '<li>' . siteMarkdownInline($unorderedMatch[1]) . '</li>';
            continue;
        }

        $paragraph[] = $trimmed;
    }

    if ($inCode) {
        $languageAttr = $codeLanguage !== '' ? ' class="language-' . h($codeLanguage) . '"' : '';
        $html[] = '<pre><code' . $languageAttr . '>' . h(implode("\n", $codeLines)) . '</code></pre>';
    }

    $flushParagraph();
    $closeLists();
    $closeBlockquote();

    return implode("\n", $html);
}
