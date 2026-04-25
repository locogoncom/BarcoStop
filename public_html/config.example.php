<?php

declare(strict_types=1);

return [
    // Copy this file to public_html/config.php and set real values.
    // You can also provide WEBSITE_DB_* as environment variables.
    // Fallback compatibility in config.php also accepts DB_*.
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3306',
    'DB_NAME' => 'barcostop_website',
    'DB_USER' => 'barcostop_user',
    'DB_PASSWORD' => 'change_me',
    'DB_CHARSET' => 'utf8mb4',

    // Public API endpoint used by website fallback reads.
    'WEBSITE_API_BASE' => 'https://api.barcostop.net/api/v1',
];
