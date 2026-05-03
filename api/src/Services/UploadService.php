<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Services;

use BarcoStop\ServerPhp\Config\AppConfig;

final class UploadService
{
    private const ALLOWED = [
        'image/jpeg' => '.jpg',
        'image/png' => '.png',
        'image/webp' => '.webp',
    ];

    private const MIME_ALIASES = [
        'image/jpg' => 'image/jpeg',
        'image/pjpeg' => 'image/jpeg',
        'image/x-png' => 'image/png',
    ];

    public function saveImage(array $file, string $subDir, int $maxBytes): string
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new \RuntimeException($this->uploadErrorMessage($error, $maxBytes));
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new \RuntimeException('Archivo excede el tamano permitido');
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new \RuntimeException('Archivo temporal inválido');
        }

        $mime = $this->resolveAllowedMime($tmp, (string) ($file['type'] ?? ''));
        if (!isset(self::ALLOWED[$mime])) {
            throw new \RuntimeException('Formato de imagen no permitido. Usa JPG, PNG o WEBP.');
        }

        $configured = trim(AppConfig::uploadsBaseDir());
        $baseDir = str_starts_with($configured, '/')
            ? rtrim($configured, '/')
            : rtrim(dirname(__DIR__, 2) . '/' . $configured, '/');
        $dir = $baseDir . '/' . trim($subDir, '/');
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('No se pudo crear directorio de subida');
        }

        $filename = sprintf('%d-%s%s', (int) round(microtime(true) * 1000), \Ramsey\Uuid\Uuid::uuid4()->toString(), self::ALLOWED[$mime]);
        $destination = $dir . '/' . $filename;

        if (!move_uploaded_file($tmp, $destination)) {
            throw new \RuntimeException('No se pudo guardar la imagen');
        }

        return rtrim(AppConfig::uploadsBaseUrl(), '/') . '/' . trim($subDir, '/') . '/' . $filename;
    }

    private function resolveAllowedMime(string $tmpPath, string $clientMime): string
    {
        $detected = $this->detectMimeFromFile($tmpPath);
        if ($detected !== '' && isset(self::ALLOWED[$detected])) {
            return $detected;
        }

        $client = $this->normalizeMime($clientMime);
        if ($client !== '' && isset(self::ALLOWED[$client])) {
            return $client;
        }

        return $detected !== '' ? $detected : $client;
    }

    private function detectMimeFromFile(string $tmpPath): string
    {
        $detected = '';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $raw = finfo_file($finfo, $tmpPath);
                finfo_close($finfo);
                if (is_string($raw)) {
                    $detected = $raw;
                }
            }
        }

        return $this->normalizeMime($detected);
    }

    private function normalizeMime(string $mime): string
    {
        $normalized = strtolower(trim(strtok($mime, ';') ?: ''));
        return self::MIME_ALIASES[$normalized] ?? $normalized;
    }

    private function uploadErrorMessage(int $code, int $maxBytes): string
    {
        if ($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE) {
            $maxMb = max(1, (int) floor($maxBytes / (1024 * 1024)));
            return sprintf('Archivo excede el tamano permitido (max %dMB)', $maxMb);
        }

        return match ($code) {
            UPLOAD_ERR_NO_FILE => 'No se recibio imagen',
            UPLOAD_ERR_PARTIAL => 'La subida se interrumpio. Intenta de nuevo',
            UPLOAD_ERR_NO_TMP_DIR => 'Error del servidor: carpeta temporal no disponible',
            UPLOAD_ERR_CANT_WRITE => 'Error del servidor: no se pudo escribir el archivo',
            UPLOAD_ERR_EXTENSION => 'Error del servidor: subida bloqueada por extension',
            default => 'No se recibio imagen',
        };
    }
}
