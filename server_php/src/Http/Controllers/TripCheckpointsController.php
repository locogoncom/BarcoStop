<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Repositories\TripRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class TripCheckpointsController
{
    public function __construct(private readonly MiscRepository $repo, private readonly TripRepository $trips, private readonly AuthMiddleware $auth) {}

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $tripId = (string) ($body['tripId'] ?? '');
        $userId = (string) ($body['userId'] ?? '');
        $checkpointType = (string) ($body['checkpointType'] ?? '');

        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }

        $trip = $this->trips->findById($tripId);
        if (!$trip) { JsonResponse::send(['error' => 'Viaje no encontrado'], 404); return; }
        if ((string) ($trip['patronId'] ?? '') !== $userId) { JsonResponse::send(['error' => 'Solo el capitan del viaje puede marcar checkpoints'], 403); return; }

        if ($tripId === '' || $userId === '' || $checkpointType === '') { JsonResponse::send(['error' => 'tripId, userId y checkpointType son obligatorios'], 400); return; }
        if (!in_array($checkpointType, ['start', 'mid', 'arrival', 'event'], true)) { JsonResponse::send(['error' => 'checkpointType inválido'], 400); return; }

        try {
            JsonResponse::send($this->repo->createTripCheckpoint($body), 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function list(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;

        $tripId = (string) ($request->query('tripId') ?? '');
        $limit = (int) ($request->query('limit') ?? 100);

        $trip = $this->trips->findById($tripId);
        if (!$trip) { JsonResponse::send(['error' => 'Viaje no encontrado'], 404); return; }
        if ($auth['userId'] !== (string) ($trip['patronId'] ?? '')) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($tripId === '') { JsonResponse::send(['error' => 'tripId query requerido'], 400); return; }

        JsonResponse::send($this->repo->listTripCheckpoints($tripId, max(1, $limit)));
    }
}
