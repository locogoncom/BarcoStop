<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class BoatsController
{
    public function __construct(private readonly MiscRepository $repo, private readonly AuthMiddleware $auth) {}

    private function actorId(Request $request): string
    {
        $body = $request->body();
        return trim((string) ($request->header('x-user-id') ?? ($body['actorId'] ?? $request->query('actorId') ?? '')));
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $actorId = $this->actorId($request);
        if ($actorId !== '' && !empty($body['patronId']) && (string) $body['patronId'] !== $actorId) {
            JsonResponse::send(['error' => 'No autorizado para crear barcos con otro capitan'], 403);
            return;
        }

        try {
            JsonResponse::send($this->repo->createBoat($body), 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function list(Request $request): void
    {
        try {
            JsonResponse::send($this->repo->listBoats([
                'patronId' => $request->query('patronId'),
                'status' => $request->query('status'),
                'type' => $request->query('type'),
            ]));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function getById(Request $request, array $params): void
    {
        $boat = $this->repo->getBoatById((string) ($params['id'] ?? ''));
        if (!$boat) { JsonResponse::send([], 404); return; }
        JsonResponse::send($boat);
    }

    public function update(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;

        $actorId = $this->actorId($request);
        if ($actorId === '') { JsonResponse::send(['error' => 'actorId requerido para actualizar barco'], 401); return; }

        $existing = $this->repo->getBoatById((string) ($params['id'] ?? ''));
        if (!$existing) { JsonResponse::send([], 404); return; }
        if ((string) ($existing['patronId'] ?? '') !== $actorId) { JsonResponse::send(['error' => 'No autorizado para modificar este barco'], 403); return; }

        try {
            JsonResponse::send($this->repo->updateBoat((string) $params['id'], $request->body()) ?? []);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;

        $actorId = $this->actorId($request);
        if ($actorId === '') { JsonResponse::send(['error' => 'actorId requerido para eliminar barco'], 401); return; }

        $existing = $this->repo->getBoatById((string) ($params['id'] ?? ''));
        if (!$existing) { JsonResponse::send([], 404); return; }
        if ((string) ($existing['patronId'] ?? '') !== $actorId) { JsonResponse::send(['error' => 'No autorizado para eliminar este barco'], 403); return; }

        $deleted = $this->repo->deleteBoat((string) $params['id']);
        if (!$deleted) { JsonResponse::send([], 404); return; }
        JsonResponse::noContent();
    }
}
