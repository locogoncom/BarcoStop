<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http;

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Http\Controllers\BoatsController;
use BarcoStop\ServerPhp\Http\Controllers\DonationsController;
use BarcoStop\ServerPhp\Http\Controllers\FavoritesController;
use BarcoStop\ServerPhp\Http\Controllers\MessagesController;
use BarcoStop\ServerPhp\Http\Controllers\RatingsController;
use BarcoStop\ServerPhp\Http\Controllers\ReservationsController;
use BarcoStop\ServerPhp\Http\Controllers\SupportMessagesController;
use BarcoStop\ServerPhp\Http\Controllers\TrackingController;
use BarcoStop\ServerPhp\Http\Controllers\TripCheckpointsController;
use BarcoStop\ServerPhp\Http\Controllers\TripsController;
use BarcoStop\ServerPhp\Http\Controllers\UsersController;
use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MessageRepository;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Repositories\ReservationRepository;
use BarcoStop\ServerPhp\Repositories\TripRepository;
use BarcoStop\ServerPhp\Repositories\UserRepository;
use BarcoStop\ServerPhp\Services\JwtService;
use BarcoStop\ServerPhp\Services\UploadService;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;
use BarcoStop\ServerPhp\Support\Router;

final class ApiKernel
{
    public function run(): void
    {
        $this->applyCors();
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            return;
        }

        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: no-referrer');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

        // Alias de compatibilidad para pruebas manuales: /api/* -> /api/v1/*
        $requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $requestPath = (string) (parse_url($requestUri, PHP_URL_PATH) ?: '/');
        if (str_starts_with($requestPath, '/api/') && !str_starts_with($requestPath, '/api/v1/')) {
            $_SERVER['REQUEST_URI'] = preg_replace('#^/api/#', '/api/v1/', $requestUri, 1) ?? $requestUri;
        }

        $request = new Request();

        if ($this->serveUploads($request->path())) {
            return;
        }

        $router = new Router();
        $this->registerRoutes($router);

        try {
            $router->dispatch($request);
        } catch (\Throwable $e) {
            JsonResponse::send([
                'error' => $e->getMessage() ?: 'Internal server error',
                'path' => $request->path(),
            ], 500);
        }
    }

    private function applyCors(): void
    {
        $configuredOrigin = trim(AppConfig::corsOrigin());
        $requestOrigin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
        $allowCredentials = true;

        if ($configuredOrigin === '*') {
            if ($requestOrigin !== '') {
                header('Access-Control-Allow-Origin: ' . $requestOrigin);
                header('Vary: Origin');
            } else {
                header('Access-Control-Allow-Origin: *');
            }
            // CORS invalido con Allow-Origin:* y credenciales.
            $allowCredentials = false;
        } else {
            $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $configuredOrigin))));
            if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
                header('Access-Control-Allow-Origin: ' . $requestOrigin);
                header('Vary: Origin');
            } elseif (!empty($allowedOrigins)) {
                header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
            } else {
                header('Access-Control-Allow-Origin: null');
            }
        }

        if ($allowCredentials) {
            header('Access-Control-Allow-Credentials: true');
        }
        header('Access-Control-Allow-Headers: Authorization, Content-Type, X-User-Id, X-Image-Kind');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }

    private function serveUploads(string $path): bool
    {
        if (!str_starts_with($path, '/uploads/')) {
            return false;
        }

        $baseDir = dirname(__DIR__, 3) . '/' . trim(AppConfig::uploadsBaseDir(), '/');
        $relative = substr($path, strlen('/uploads/'));
        $full = realpath($baseDir . '/' . $relative);
        if (!$full || !str_starts_with($full, realpath($baseDir) ?: $baseDir) || !is_file($full)) {
            JsonResponse::send(['error' => 'Not Found'], 404);
            return true;
        }

        $mime = mime_content_type($full) ?: 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=604800, immutable');
        readfile($full);
        return true;
    }

    private function registerRoutes(Router $router): void
    {
        $jwt = new JwtService();
        $auth = new AuthMiddleware($jwt);
        $upload = new UploadService();

        $usersRepo = new UserRepository();
        $tripsRepo = new TripRepository();
        $reservationsRepo = new ReservationRepository();
        $messagesRepo = new MessageRepository();
        $miscRepo = new MiscRepository();

        $users = new UsersController($usersRepo, $jwt, $auth, $upload);
        $trips = new TripsController($tripsRepo, $auth, $upload);
        $reservations = new ReservationsController($reservationsRepo, $tripsRepo, $auth);
        $messages = new MessagesController($messagesRepo, $auth);
        $ratings = new RatingsController($usersRepo, $auth);
        $favorites = new FavoritesController($miscRepo, $auth);
        $donations = new DonationsController($miscRepo, $auth);
        $support = new SupportMessagesController($miscRepo, $auth);
        $checkpoints = new TripCheckpointsController($miscRepo, $tripsRepo, $auth);
        $tracking = new TrackingController($miscRepo, $tripsRepo, $auth);
        $boats = new BoatsController($miscRepo, $auth);

        $router->add('GET', '/', static fn() => JsonResponse::send(['status' => 'ok', 'message' => 'BarcoStop API PHP running']));

        $v1 = '/api/v1';

        // users
        $router->add('POST', "$v1/users", fn(Request $r) => $users->register($r));
        $router->add('GET', "$v1/users", fn(Request $r) => $users->list($r));
        $router->add('POST', "$v1/users/login", fn(Request $r) => $users->login($r));
        $router->add('GET', "$v1/users/{id}", fn(Request $r, array $p) => $users->getById($r, $p));
        $router->add('PATCH', "$v1/users/{id}", fn(Request $r, array $p) => $users->update($r, $p));
        $router->add('PUT', "$v1/users/{id}", fn(Request $r, array $p) => $users->update($r, $p));
        $router->add('POST', "$v1/users/{id}/avatar", fn(Request $r, array $p) => $users->uploadAvatar($r, $p));
        $router->add('POST', "$v1/users/avatar/{id}", fn(Request $r, array $p) => $users->uploadAvatar($r, $p));
        $router->add('DELETE', "$v1/users/{id}", fn(Request $r, array $p) => $users->delete($r, $p));
        $router->add('POST', "$v1/users/{id}/ratings", fn(Request $r, array $p) => $users->addRating($r, $p));

        // trips
        $router->add('POST', "$v1/trips/upload-image", fn(Request $r) => $trips->uploadImage($r));
        $router->add('POST', "$v1/trips", fn(Request $r) => $trips->create($r));
        $router->add('GET', "$v1/trips", fn(Request $r) => $trips->list($r));
        $router->add('GET', "$v1/trips/{id}", fn(Request $r, array $p) => $trips->getById($r, $p));
        $router->add('PATCH', "$v1/trips/{id}", fn(Request $r, array $p) => $trips->update($r, $p));
        $router->add('DELETE', "$v1/trips/{id}", fn(Request $r, array $p) => $trips->delete($r, $p));

        // reservations
        $router->add('POST', "$v1/reservations", fn(Request $r) => $reservations->create($r));
        $router->add('GET', "$v1/reservations", fn(Request $r) => $reservations->list($r));
        $router->add('GET', "$v1/reservations/{id}", fn(Request $r, array $p) => $reservations->getById($r, $p));
        $router->add('PATCH', "$v1/reservations/{id}", fn(Request $r, array $p) => $reservations->update($r, $p));
        $router->add('DELETE', "$v1/reservations/{id}", fn(Request $r, array $p) => $reservations->delete($r, $p));

        // messages
        $router->add('GET', "$v1/messages/conversations/{userId}", fn(Request $r, array $p) => $messages->listConversations($r, $p));
        $router->add('GET', "$v1/messages/conversation/{conversationId}/messages", fn(Request $r, array $p) => $messages->listMessages($r, $p));
        $router->add('POST', "$v1/messages/send", fn(Request $r) => $messages->send($r));
        $router->add('POST', "$v1/messages/conversation", fn(Request $r) => $messages->createConversation($r));
        $router->add('GET', "$v1/messages/regatta/{tripId}/chat", fn(Request $r, array $p) => $messages->getRegattaChat($r, $p));
        $router->add('GET', "$v1/messages/regatta/{tripId}/chat/messages", fn(Request $r, array $p) => $messages->getRegattaMessages($r, $p));
        $router->add('POST', "$v1/messages/regatta/{tripId}/chat/messages", fn(Request $r, array $p) => $messages->sendRegattaMessage($r, $p));
        $router->add('GET', "$v1/messages/block/status", fn(Request $r) => $messages->blockStatus($r));
        $router->add('POST', "$v1/messages/block", fn(Request $r) => $messages->block($r));
        $router->add('DELETE', "$v1/messages/block", fn(Request $r) => $messages->unblock($r));
        $router->add('POST', "$v1/messages/report", fn(Request $r) => $messages->report($r));
        $router->add('PATCH', "$v1/messages/{messageId}/read", fn(Request $r, array $p) => $messages->markRead($r, $p));
        $router->add('PATCH', "$v1/messages/conversation/{conversationId}/read-all", fn(Request $r, array $p) => $messages->markConversationRead($r, $p));

        // ratings
        $router->add('POST', "$v1/ratings", fn(Request $r) => $ratings->create($r));
        $router->add('GET', "$v1/ratings/user/{userId}", fn(Request $r, array $p) => $ratings->listByUser($r, $p));
        $router->add('GET', "$v1/ratings/from/{userId}", fn(Request $r, array $p) => $ratings->listFromUser($r, $p));
        $router->add('GET', "$v1/ratings/{id}", fn(Request $r, array $p) => $ratings->getById($r, $p));
        $router->add('DELETE', "$v1/ratings/{id}", fn(Request $r, array $p) => $ratings->delete($r, $p));

        // favorites
        $router->add('GET', "$v1/favorites/{userId}", fn(Request $r, array $p) => $favorites->list($r, $p));
        $router->add('POST', "$v1/favorites", fn(Request $r) => $favorites->create($r));
        $router->add('DELETE', "$v1/favorites/{userId}/{favoriteUserId}", fn(Request $r, array $p) => $favorites->delete($r, $p));
        $router->add('GET', "$v1/favorites/{userId}/{favoriteUserId}/check", fn(Request $r, array $p) => $favorites->check($r, $p));

        // donations
        $router->add('POST', "$v1/donations", fn(Request $r) => $donations->create($r));
        $router->add('GET', "$v1/donations/user/{userId}", fn(Request $r, array $p) => $donations->listByUser($r, $p));
        $router->add('GET', "$v1/donations/total/{userId}", fn(Request $r, array $p) => $donations->totalByUser($r, $p));

        // support
        $router->add('GET', "$v1/support-messages/user/{userId}", fn(Request $r, array $p) => $support->listByUser($r, $p));
        $router->add('POST', "$v1/support-messages", fn(Request $r) => $support->create($r));
        $router->add('DELETE', "$v1/support-messages/{id}", fn(Request $r, array $p) => $support->delete($r, $p));

        // checkpoints
        $router->add('GET', "$v1/trip-checkpoints", fn(Request $r) => $checkpoints->list($r));
        $router->add('POST', "$v1/trip-checkpoints", fn(Request $r) => $checkpoints->create($r));

        // tracking
        $router->add('POST', "$v1/tracking", fn(Request $r) => $tracking->create($r));
        $router->add('GET', "$v1/tracking", fn(Request $r) => $tracking->list($r));
        $router->add('GET', "$v1/tracking/{tripId}/last", fn(Request $r, array $p) => $tracking->last($r, $p));

        // boats
        $router->add('POST', "$v1/boats", fn(Request $r) => $boats->create($r));
        $router->add('GET', "$v1/boats", fn(Request $r) => $boats->list($r));
        $router->add('GET', "$v1/boats/{id}", fn(Request $r, array $p) => $boats->getById($r, $p));
        $router->add('PATCH', "$v1/boats/{id}", fn(Request $r, array $p) => $boats->update($r, $p));
        $router->add('DELETE', "$v1/boats/{id}", fn(Request $r, array $p) => $boats->delete($r, $p));
    }
}
