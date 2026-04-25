<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Config;

final class AppConfig
{
    public static function env(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($value === false || $value === null || $value === '') {
            return $default;
        }

        return (string) $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::env($key);
        if ($value === null) {
            return $default;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    public static function int(string $key, int $default): int
    {
        $value = self::env($key);
        if ($value === null || !is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    public static function corsOrigin(): string
    {
        return self::env('CORS_ORIGIN', '*') ?? '*';
    }

    public static function uploadsBaseDir(): string
    {
        return self::env('UPLOADS_BASE_DIR', 'storage/uploads') ?? 'storage/uploads';
    }

    public static function uploadsBaseUrl(): string
    {
        return self::env('UPLOADS_BASE_URL', '/uploads') ?? '/uploads';
    }

    public static function jwtSecret(): string
    {
        $secret = self::env('AUTH_TOKEN_SECRET') ?? self::env('JWT_SECRET');
        if (!$secret || strlen(trim($secret)) < 24) {
            throw new \RuntimeException('AUTH_TOKEN_SECRET/JWT_SECRET no configurado o demasiado debil (min 24 chars)');
        }

        return $secret;
    }

    public static function jwtExpSeconds(): int
    {
        return self::int('JWT_EXP_SECONDS', 60 * 60 * 24 * 7);
    }

    public static function appLatestVersion(): string
    {
        return self::env('APP_LATEST_VERSION', '0.0.0') ?? '0.0.0';
    }

    public static function appMinSupportedVersion(): string
    {
        return self::env('APP_MIN_SUPPORTED_VERSION', self::appLatestVersion()) ?? self::appLatestVersion();
    }

    public static function appForceUpdate(): bool
    {
        return self::bool('APP_FORCE_UPDATE', false);
    }

    public static function appAndroidStoreUrl(): string
    {
        return self::env('APP_ANDROID_STORE_URL', 'https://play.google.com/store/apps/details?id=com.barcostop.app') ?? 'https://play.google.com/store/apps/details?id=com.barcostop.app';
    }

    public static function appIosStoreUrl(): string
    {
        return self::env('APP_IOS_STORE_URL', '') ?? '';
    }

    public static function appVersionMessage(): ?string
    {
        $message = trim((string) (self::env('APP_VERSION_MESSAGE', '') ?? ''));
        return $message !== '' ? $message : null;
    }

    public static function googleAuthEnabled(): bool
    {
        return self::bool('GOOGLE_AUTH_ENABLED', false);
    }

    public static function googleAuthStrict(): bool
    {
        return self::bool('GOOGLE_AUTH_STRICT', false);
    }

    public static function googleClientId(): string
    {
        return trim((string) (self::env('GOOGLE_CLIENT_ID', '') ?? ''));
    }

    public static function googleRedirectUri(): string
    {
        return trim((string) (self::env('GOOGLE_REDIRECT_URI', '') ?? ''));
    }

    public static function googleScopes(): string
    {
        return trim((string) (self::env('GOOGLE_SCOPE', 'openid email profile') ?? 'openid email profile'));
    }

    /**
     * @return string[]
     */
    public static function googleAllowedClientIds(): array
    {
        $raw = trim((string) (self::env('GOOGLE_ALLOWED_CLIENT_IDS', '') ?? ''));
        if ($raw !== '') {
            $ids = array_map('trim', explode(',', $raw));
            return array_values(array_unique(array_filter($ids, static fn(string $id) => $id !== '')));
        }

        $candidates = [
            trim((string) (self::env('GOOGLE_CLIENT_ID', '') ?? '')),
            trim((string) (self::env('GOOGLE_WEB_CLIENT_ID', '') ?? '')),
            trim((string) (self::env('GOOGLE_ANDROID_CLIENT_ID', '') ?? '')),
        ];

        return array_values(array_unique(array_filter($candidates, static fn(string $id) => $id !== '')));
    }
}
