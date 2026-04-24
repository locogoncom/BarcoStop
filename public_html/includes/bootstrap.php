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

siteLoadEnvFile(dirname(__DIR__, 1) . '/api/.env');
siteLoadEnvFile(dirname(__DIR__, 2) . '/.env');

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
