<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\TripRepository;
use BarcoStop\ServerPhp\Services\UploadService;
use BarcoStop\ServerPhp\Support\Helpers;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class TripsController
{
    public function __construct(
        private readonly TripRepository $trips,
        private readonly AuthMiddleware $auth,
        private readonly UploadService $upload
    ) {
    }

    private function getActorId(Request $request): string
    {
        $body = $request->body();
        $fromHeader = trim((string) ($request->header('x-user-id') ?? ''));
        return (string) ($fromHeader ?: ($body['actorId'] ?? $request->query('actorId') ?? ''));
    }

    public function uploadImage(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $requestedOwner = trim((string) ($request->header('x-user-id') ?? ''));
        if ($requestedOwner !== '' && $requestedOwner !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para subir una imagen para otro usuario'], 403);
            return;
        }

        try {
            $file = $request->file('image');
            if (!$file) {
                JsonResponse::send(['error' => 'No se recibio imagen'], 400);
                return;
            }

            $imageKind = strtolower(trim((string) ($request->header('x-image-kind') ?? ($request->body()['imageKind'] ?? 'trip'))));
            $max = $imageKind === 'regatta' ? 2 * 1024 * 1024 : 7 * 1024 * 1024;
            $path = $this->upload->saveImage($file, 'trips', $max);
            JsonResponse::send(['image' => $path], 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        try {
            $body = $request->body();
            $actorId = $this->getActorId($request);
            if ($actorId !== '' && !empty($body['patronId']) && (string) $body['patronId'] !== $actorId) {
                JsonResponse::send(['error' => 'No autorizado para crear viajes con otro patrón'], 403);
                return;
            }

            if (isset($body['description']) && is_string($body['description']) && str_contains($body['description'], "\n[BSMETA]")) {
                $parts = explode("\n[BSMETA]", $body['description'], 2);
                if (count($parts) === 2) {
                    $meta = json_decode(trim($parts[1]), true);
                    if (is_array($meta) && array_key_exists('boatImageUrl', $meta)) {
                        $meta['boatImageUrl'] = Helpers::toUploadPath($meta['boatImageUrl']) ?? $meta['boatImageUrl'];
                        $body['description'] = $parts[0] . "\n[BSMETA]" . json_encode($meta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    }
                }
            }

            $trip = $this->trips->create($body);
            JsonResponse::send($trip, 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function list(Request $request): void
    {
        try {
            $filters = [];
            foreach (['patronId', 'origin', 'destination', 'status', 'departureDate'] as $key) {
                $value = $request->query($key);
                if ($value !== null && $value !== '') {
                    $filters[$key] = (string) $value;
                }
            }
            JsonResponse::send($this->trips->findAll($filters));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function getById(Request $request, array $params): void
    {
        $trip = $this->trips->findById((string) ($params['id'] ?? ''));
        if (!$trip) {
            JsonResponse::send([], 404);
            return;
        }
        JsonResponse::send($trip);
    }

    public function update(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $actorId = $this->getActorId($request);
        if ($actorId === '') {
            JsonResponse::send(['error' => 'actorId requerido para actualizar viaje'], 401);
            return;
        }

        $existing = $this->trips->findById((string) ($params['id'] ?? ''));
        if (!$existing) {
            JsonResponse::send([], 404);
            return;
        }

        if ((string) ($existing['patronId'] ?? '') !== $actorId) {
            JsonResponse::send(['error' => 'No autorizado para modificar este viaje'], 403);
            return;
        }

        try {
            $trip = $this->trips->update((string) $params['id'], $request->body());
            JsonResponse::send($trip ?? []);
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

        $actorId = $this->getActorId($request);
        if ($actorId === '') {
            JsonResponse::send(['error' => 'actorId requerido para eliminar viaje'], 401);
            return;
        }

        $existing = $this->trips->findById((string) ($params['id'] ?? ''));
        if (!$existing) {
            JsonResponse::send([], 404);
            return;
        }
        if ((string) ($existing['patronId'] ?? '') !== $actorId) {
            JsonResponse::send(['error' => 'No autorizado para eliminar este viaje'], 403);
            return;
        }

        $this->trips->delete((string) $params['id']);
        JsonResponse::noContent();
    }

    public function autoPublishReddit(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) {
            return;
        }

        $tripId = (string) ($params['id'] ?? '');
        $actorId = $this->getActorId($request);
        if ($actorId === '') {
            JsonResponse::send(['error' => 'actorId requerido para publicar en Reddit'], 401);
            return;
        }

        $trip = $this->trips->findById($tripId);
        if (!$trip) {
            JsonResponse::send([], 404);
            return;
        }
        if ((string) ($trip['patronId'] ?? '') !== $actorId) {
            JsonResponse::send(['error' => 'No autorizado para publicar este viaje'], 403);
            return;
        }

        $clientId = trim((string) (AppConfig::env('REDDIT_CLIENT_ID', '') ?? ''));
        $username = trim((string) (AppConfig::env('REDDIT_USERNAME', '') ?? ''));
        $subreddit = trim((string) (AppConfig::env('REDDIT_SUBREDDIT', '') ?? ''));
        $enabled = $clientId !== '' && $username !== '' && $subreddit !== '';

        // Requested behavior: when Reddit is not configured, do nothing and do not fail.
        if (!$enabled) {
            JsonResponse::send([
                'enabled' => false,
                'status' => 'DISABLED',
                'skipped' => true,
            ], 200);
            return;
        }

        $origin = (string) ($trip['origin'] ?? '');
        $destination = (string) ($trip['destination'] ?? '');
        $date = (string) ($trip['departureDate'] ?? '');
        $price = isset($trip['cost']) ? (float) $trip['cost'] : 0.0;

        $title = trim("BarcoStop: $origin -> $destination ($date)");
        $text = "Nuevo viaje disponible. Precio desde " . number_format($price, 2, '.', '') . " EUR.";
        $draftUrl = 'https://www.reddit.com/r/' . rawurlencode($subreddit) . '/submit?'
            . http_build_query([
                'title' => $title,
                'text' => $text,
            ]);

        JsonResponse::send([
            'enabled' => true,
            'status' => 'QUEUED_PLACEHOLDER',
            'message' => 'Autopublicacion Reddit preparada (placeholder)',
            'subreddit' => $subreddit,
            'title' => $title,
            'body' => $text,
            'draftUrl' => $draftUrl,
            'requiresManualPublish' => true,
        ], 202);
    }
}
