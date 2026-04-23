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

    public function saveImage(array $file, string $subDir, int $maxBytes): string
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('No se recibio imagen');
        }

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new \RuntimeException('Archivo excede el tamano permitido');
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new \RuntimeException('Archivo temporal inválido');
        }

        $mime = (string) ($file['type'] ?? '');
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
}
