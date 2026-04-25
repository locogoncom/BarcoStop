<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\UserRepository;
use BarcoStop\ServerPhp\Services\GoogleIdTokenVerifier;
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
        private readonly UploadService $upload,
        private readonly GoogleIdTokenVerifier $googleVerifier
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

    public function loginGoogle(Request $request): void
    {
        $body = $request->body();
        $idToken = trim((string) ($body['idToken'] ?? ''));
        if ($idToken === '') {
            JsonResponse::send(['error' => 'Google idToken es requerido'], 400);
            return;
        }

        $normalizedRole = Helpers::normalizeRole($body['role'] ?? null, false);
        $strict = AppConfig::googleAuthStrict();
        $allowedClientIds = AppConfig::googleAllowedClientIds();

        $verification = $this->googleVerifier->verify($idToken, $allowedClientIds);
        $verified = (bool) ($verification['ok'] ?? false);

        if (!$verified && $strict) {
            $error = trim((string) ($verification['error'] ?? 'No se pudo validar token de Google'));
            JsonResponse::send(['error' => $error], 401);
            return;
        }

        $nameFromBody = trim((string) ($body['name'] ?? ''));
        $emailFromBody = trim((string) ($body['email'] ?? ''));

        $email = $verified
            ? trim((string) ($verification['email'] ?? ''))
            : $emailFromBody;
        if ($email === '') {
            $hash = substr(hash('sha256', $idToken), 0, 16);
            $email = 'google_' . $hash . '@placeholder.barcostop.local';
        }
        $displayNameFromToken = $verified ? trim((string) ($verification['name'] ?? '')) : '';

        $rawUser = $this->users->findByEmail($email);
        if (!$rawUser) {
            $displayName = $nameFromBody !== '' ? $nameFromBody : ($displayNameFromToken !== '' ? $displayNameFromToken : 'Google User');
            $generatedPassword = password_hash(bin2hex(random_bytes(12)), PASSWORD_BCRYPT, ['cost' => 10]);
            try {
                $createdId = $this->users->create([
                    'name' => $displayName,
                    'email' => $email,
                    'password' => $generatedPassword,
                    'role' => $normalizedRole,
                ]);
                $rawUser = $this->users->findById($createdId);
            } catch (\Throwable $e) {
                JsonResponse::send(['error' => $e->getMessage()], 400);
                return;
            }
        } else {
            try {
                $updates = ['role' => $normalizedRole];
                if ($nameFromBody !== '') {
                    $updates['name'] = $nameFromBody;
                } elseif ($displayNameFromToken !== '') {
                    $updates['name'] = $displayNameFromToken;
                }
                $this->users->update((string) ($rawUser['id'] ?? ''), $updates);
            } catch (\Throwable $e) {
            }
        }

        $userId = (string) ($rawUser['id'] ?? '');
        if ($userId === '') {
            JsonResponse::send(['error' => 'No se pudo resolver usuario Google'], 500);
            return;
        }

        $user = $this->users->findById($userId);
        if (!$user) {
            JsonResponse::send(['error' => 'Usuario no encontrado'], 404);
            return;
        }

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
            'googleAuthMode' => $verified ? 'REAL' : 'PLACEHOLDER',
            'googleAuthStrict' => $strict,
        ]);
    }

    public function googleAuthConfig(Request $request): void
    {
        $clientId = AppConfig::googleClientId();
        $redirectUri = AppConfig::googleRedirectUri();
        $scope = AppConfig::googleScopes();
        $strict = AppConfig::googleAuthStrict();
        $allowedClientIds = AppConfig::googleAllowedClientIds();
        $enabled = AppConfig::googleAuthEnabled() && !empty($allowedClientIds);

        $authUrl = null;
        if ($enabled && $clientId !== '' && $redirectUri !== '') {
            $params = http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code',
                'scope' => $scope,
                'access_type' => 'offline',
                'include_granted_scopes' => 'true',
                'prompt' => 'consent',
            ]);
            $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . $params;
        }

        JsonResponse::send([
            'enabled' => $enabled,
            'mode' => $enabled ? 'OAUTH_URL' : 'PLACEHOLDER',
            'strict' => $strict,
            'clientIdConfigured' => $clientId !== '',
            'redirectUriConfigured' => $redirectUri !== '',
            'allowedClientIdsConfigured' => count($allowedClientIds),
            'scope' => $scope,
            'authUrl' => $authUrl,
            'message' => $enabled
                ? 'Google login habilitado. Backend verifica idToken.'
                : 'Configura GOOGLE_AUTH_ENABLED=1 y GOOGLE_ALLOWED_CLIENT_IDS para habilitar verificacion real.',
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
