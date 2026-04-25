<?php

declare(strict_types=1);

/**
 * Loads public_html/.env into $_ENV and process environment.
 */
function websiteLoadLocalEnv(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $envPath = __DIR__ . '/.env';
    if (!is_file($envPath) || !is_readable($envPath)) {
        return;
    }

    $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim((string) $line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $pos = strpos($trimmed, '=');
        if ($pos === false || $pos < 1) {
            continue;
        }

        $key = trim(substr($trimmed, 0, $pos));
        $value = trim(substr($trimmed, $pos + 1));
        if ($key === '') {
            continue;
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
        putenv($key . '=' . $value);
    }
}

websiteLoadLocalEnv();

return [
    // Website-only config (independent from API config).
    'DB_HOST' => getenv('DB_HOST') ?: '',
    'DB_PORT' => getenv('DB_PORT') ?: '3306',
    'DB_NAME' => getenv('DB_NAME') ?: '',
    'DB_USER' => getenv('DB_USER') ?: '',
    'DB_PASSWORD' => getenv('DB_PASSWORD') ?: '',
    'DB_CHARSET' => getenv('DB_CHARSET') ?: 'utf8mb4',

    // Public API base used by website fallback data fetches.
    'WEBSITE_API_BASE' => getenv('WEBSITE_API_BASE') ?: 'https://api.barcostop.net/api/v1',
];
