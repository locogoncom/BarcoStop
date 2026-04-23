<?php

declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$publicPath = __DIR__ . $uri;

if ($uri !== '/' && is_file($publicPath)) {
    return false;
}

if (str_starts_with($uri, '/uploads/')) {
    $base = dirname(__DIR__) . '/storage/uploads/';
    $relative = substr($uri, strlen('/uploads/'));
    $target = realpath($base . $relative);

    if ($target !== false && str_starts_with($target, realpath($base) ?: $base) && is_file($target)) {
        $ext = strtolower(pathinfo($target, PATHINFO_EXTENSION));
        $types = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
        ];
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=604800, immutable');
        readfile($target);
        exit;
    }

    http_response_code(404);
    echo 'Not found';
    exit;
}

require __DIR__ . '/index.php';
