<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Repositories\TripRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class TrackingController
{
    public function __construct(private readonly MiscRepository $repo, private readonly TripRepository $trips, private readonly AuthMiddleware $auth) {}

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $tripId = (string) ($body['tripId'] ?? '');

        if ($tripId === '') { JsonResponse::send(['error' => 'tripId is required'], 400); return; }
        $trip = $this->trips->findById($tripId);
        if (!$trip) { JsonResponse::send(['error' => 'Trip not found'], 404); return; }
        if ($auth['userId'] !== (string) ($trip['patronId'] ?? '')) { JsonResponse::send(['error' => 'Not authorized for trip tracking'], 403); return; }

        try {
            JsonResponse::send($this->repo->createTracking($body));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function list(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $tripId = (string) ($request->query('tripId') ?? '');
        $limit = (int) ($request->query('limit') ?? 100);

        if ($tripId === '') { JsonResponse::send(['error' => 'tripId query required'], 400); return; }
        $trip = $this->trips->findById($tripId);
        if (!$trip) { JsonResponse::send(['error' => 'Trip not found'], 404); return; }
        if ($auth['userId'] !== (string) ($trip['patronId'] ?? '')) { JsonResponse::send(['error' => 'Not authorized for trip tracking'], 403); return; }

        JsonResponse::send($this->repo->listTracking($tripId, max(1, $limit)));
    }

    public function last(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $tripId = (string) ($params['tripId'] ?? '');
        $trip = $this->trips->findById($tripId);
        if (!$trip) { JsonResponse::send(['error' => 'Trip not found'], 404); return; }
        if ($auth['userId'] !== (string) ($trip['patronId'] ?? '')) { JsonResponse::send(['error' => 'Not authorized for trip tracking'], 403); return; }

        $row = $this->repo->lastTracking($tripId);
        if (!$row) { JsonResponse::send([], 404); return; }
        JsonResponse::send($row);
    }
}
