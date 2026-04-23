<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Support;

final class Request
{
    private ?array $jsonBody = null;

    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        return $path ?: '/';
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function header(string $name): ?string
    {
        $needle = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$needle])) {
            return trim((string) $_SERVER[$needle]);
        }

        if (strtolower($name) === 'content-type' && isset($_SERVER['CONTENT_TYPE'])) {
            return trim((string) $_SERVER['CONTENT_TYPE']);
        }

        return null;
    }

    public function bearerToken(): string
    {
        $header = $this->header('Authorization') ?? '';
        if (stripos($header, 'Bearer ') !== 0) {
            return '';
        }

        return trim(substr($header, 7));
    }

    public function body(): array
    {
        if ($this->jsonBody !== null) {
            return $this->jsonBody;
        }

        $contentType = strtolower($this->header('Content-Type') ?? '');
        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode((string) $raw, true);
            $this->jsonBody = is_array($decoded) ? $decoded : [];
            return $this->jsonBody;
        }

        $this->jsonBody = $_POST;
        return $this->jsonBody;
    }

    public function file(string $key): ?array
    {
        if (!isset($_FILES[$key])) {
            return null;
        }
        $file = $_FILES[$key];
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        return $file;
    }
}
