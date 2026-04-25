<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Services;

use BarcoStop\ServerPhp\Config\AppConfig;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    public function createToken(array $payload, ?int $expiresInSeconds = null): string
    {
        $now = time();
        $exp = $now + ($expiresInSeconds ?? AppConfig::jwtExpSeconds());
        $claims = [
            ...$payload,
            'iat' => $now,
            'exp' => $exp,
        ];

        return JWT::encode($claims, AppConfig::jwtSecret(), 'HS256');
    }

    public function verifyToken(string $token): array
    {
        if ($token === '') {
            throw new \RuntimeException('Token inválido');
        }

        try {
            $decoded = JWT::decode($token, new Key(AppConfig::jwtSecret(), 'HS256'));
        } catch (\Throwable $e) {
            $msg = strtolower($e->getMessage());
            if (str_contains($msg, 'expired')) {
                throw new \RuntimeException('Token expirado');
            }
            throw new \RuntimeException('Firma de token inválida');
        }

        $payload = json_decode(json_encode($decoded, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($payload)) {
            throw new \RuntimeException('Token inválido');
        }

        return $payload;
    }
}
