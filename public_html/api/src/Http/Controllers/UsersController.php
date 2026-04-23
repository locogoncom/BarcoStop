<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\UserRepository;
use BarcoStop\ServerPhp\Services\JwtService;
use BarcoStop\ServerPhp\Services\UploadService;
use BarcoStop\ServerPhp\Support\Helpers;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class UsersController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly JwtService $jwt,
        private readonly AuthMiddleware $auth,
        private readonly UploadService $upload
    ) {
    }

    public function register(Request $request): void
    {
        $body = $request->body();
        $password = (string) ($body['password'] ?? '');
        if (strlen(trim($password)) < 4) {
            JsonResponse::send(['error' => 'La contraseña es requerida y debe tener al menos 4 caracteres.'], 400);
            return;
        }

        if (empty($body['email']) || empty($body['name'])) {
            JsonResponse::send(['error' => 'name y email son requeridos'], 400);
            return;
        }

        try {
            $hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            $id = $this->users->create([
                ...$body,
                'password' => $hashed,
                'avatar' => Helpers::toUploadPath($body['avatar'] ?? null) ?? ($body['avatar'] ?? null),
            ]);
            $user = $this->users->findById($id);
            JsonResponse::send($user ?? ['id' => $id], 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function login(Request $request): void
    {
        $body = $request->body();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($email === '' || $password === '') {
            JsonResponse::send(['error' => 'Email y contraseña son requeridos'], 400);
            return;
        }

        $rawUser = $this->users->findByEmail($email);
        if (!$rawUser) {
            JsonResponse::send(['error' => 'Usuario no encontrado'], 404);
            return;
        }

        if (!password_verify($password, (string) ($rawUser['password'] ?? ''))) {
            JsonResponse::send(['error' => 'Contraseña incorrecta'], 401);
            return;
        }

        $user = $this->users->findById((string) $rawUser['id']);
        if (!$user) {
            JsonResponse::send(['error' => 'Usuario no encontrado'], 404);
            return;
        }

        $normalizedRoleHint = Helpers::normalizeRole($body['role'] ?? null, true);
        JsonResponse::send([
            'userId' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'token' => $this->jwt->createToken([
                'userId' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role'],
            ]),
            'roleHintIgnored' => (bool) ($normalizedRoleHint && $normalizedRoleHint !== $user['role']),
        ]);
    }

    public function list(Request $request): void
    {
        try {
            $users = $this->users->findAll($request->query('role') ? (string) $request->query('role') : null);
            JsonResponse::send($users);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function getById(Request $request, array $params): void
    {
        $user = $this->users->findById((string) ($params['id'] ?? ''));
        if (!$user) {
            JsonResponse::send([], 404);
            return;
        }
        JsonResponse::send($user);
    }

    public function update(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $id = (string) ($params['id'] ?? '');
        if ($auth['userId'] !== $id) {
            JsonResponse::send(['error' => 'No autorizado para actualizar este usuario'], 403);
            return;
        }

        try {
            $body = $request->body();
            if (array_key_exists('avatar', $body)) {
                $body['avatar'] = Helpers::toUploadPath($body['avatar']) ?? $body['avatar'];
            }
            $user = $this->users->update($id, $body);
            if (!$user) {
                JsonResponse::send(['error' => 'Usuario no encontrado para actualizar perfil'], 404);
                return;
            }
            JsonResponse::send($user);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function uploadAvatar(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $id = (string) ($params['id'] ?? '');
        if ($auth['userId'] !== $id) {
            JsonResponse::send(['error' => 'No autorizado para actualizar este avatar'], 403);
            return;
        }

        try {
            $file = $request->file('avatar');
            if (!$file) {
                JsonResponse::send(['error' => 'No se recibio imagen'], 400);
                return;
            }

            $avatarPath = $this->upload->saveImage($file, 'avatars', 5 * 1024 * 1024);
            $user = $this->users->update($id, ['avatar' => $avatarPath]);
            if (!$user) {
                JsonResponse::send([], 404);
                return;
            }

            JsonResponse::send(['avatar' => $avatarPath, 'user' => $user], 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }
        $id = (string) ($params['id'] ?? '');

        if ($auth['userId'] !== $id) {
            JsonResponse::send(['error' => 'No autorizado para eliminar este usuario'], 403);
            return;
        }

        $this->users->delete($id);
        JsonResponse::noContent();
    }

    public function addRating(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $body = $request->body();
        if ((string) ($body['ratedBy'] ?? '') !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para calificar en nombre de otro usuario'], 403);
            return;
        }

        try {
            $this->users->addRating((string) ($params['id'] ?? ''), $body);
            $user = $this->users->findById((string) ($params['id'] ?? ''));
            if (!$user) {
                JsonResponse::send([], 404);
                return;
            }
            JsonResponse::send($user);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }
}
