<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Middleware;

use BarcoStop\ServerPhp\Services\JwtService;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class AuthMiddleware
{
    public function __construct(private readonly JwtService $jwt)
    {
    }

    /**
     * @return array{userId:string,role:mixed,email:mixed,name:mixed}|null
     */
    public function requireAuth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if ($token === '') {
            JsonResponse::send(['error' => 'Token requerido'], 401);
            return null;
        }

        try {
            $payload = $this->jwt->verifyToken($token);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage() ?: 'Token inválido'], 401);
            return null;
        }

        return [
            'userId' => (string) ($payload['userId'] ?? ''),
            'role' => $payload['role'] ?? null,
            'email' => $payload['email'] ?? null,
            'name' => $payload['name'] ?? null,
        ];
    }
}
