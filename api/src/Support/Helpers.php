<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Support;

final class Helpers
{
    public static function normalizeRole(mixed $role, bool $allowNull = false): ?string
    {
        $value = strtolower(trim((string) ($role ?? '')));
        if (in_array($value, ['captain', 'capitan', 'patrón', 'patron'], true)) {
            return 'patron';
        }
        if (in_array($value, ['traveler', 'traveller', 'viajero', 'viajera'], true)) {
            return 'viajero';
        }

        return $allowNull ? null : 'viajero';
    }

    public static function toUploadPath(mixed $value): ?string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '') {
            return null;
        }

        if (str_starts_with($raw, '/uploads/')) {
            return $raw;
        }

        if (preg_match('#^uploads/#i', $raw) === 1) {
            return '/' . $raw;
        }

        if (preg_match('#^https?://#i', $raw) === 1) {
            $path = parse_url($raw, PHP_URL_PATH) ?: '';
            $normalized = preg_replace('#^/api(?:/v1)?(?=/uploads/)#i', '', (string) $path);
            if (is_string($normalized) && str_starts_with($normalized, '/uploads/')) {
                return $normalized;
            }
        }

        return null;
    }

    public static function nowMillis(?string $value): int
    {
        if (!$value) {
            return (int) round(microtime(true) * 1000);
        }
        $ts = strtotime($value);
        if ($ts === false) {
            return (int) round(microtime(true) * 1000);
        }
        return $ts * 1000;
    }
}
