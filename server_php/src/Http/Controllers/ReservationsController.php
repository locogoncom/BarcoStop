<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\ReservationRepository;
use BarcoStop\ServerPhp\Repositories\TripRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class ReservationsController
{
    public function __construct(
        private readonly ReservationRepository $reservations,
        private readonly TripRepository $trips,
        private readonly AuthMiddleware $auth
    ) {
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $tripId = (string) ($body['tripId'] ?? '');
        $userId = (string) ($body['userId'] ?? '');
        $seats = (int) ($body['seats'] ?? 1);

        if ($userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        $trip = $this->trips->findById($tripId);
        if (!$trip) {
            JsonResponse::send(['error' => 'Viaje no encontrado'], 404);
            return;
        }

        if ((int) ($trip['availableSeats'] ?? 0) < $seats) {
            JsonResponse::send(['error' => 'No hay asientos disponibles'], 400);
            return;
        }

        if ($this->reservations->existsForTripUser($tripId, $userId)) {
            JsonResponse::send(['error' => 'Ya tienes una solicitud para este viaje'], 400);
            return;
        }

        try {
            $reservation = $this->reservations->create([
                'tripId' => $tripId,
                'userId' => $userId,
                'seats' => $seats,
                'status' => 'pending',
            ]);
            JsonResponse::send($reservation, 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function list(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        try {
            $tripId = (string) ($request->query('tripId') ?? '');
            $userId = (string) ($request->query('userId') ?? '');

            if ($tripId !== '') {
                $trip = $this->trips->findById($tripId);
                if (!$trip) {
                    JsonResponse::send(['error' => 'Viaje no encontrado'], 404);
                    return;
                }
                if ((string) ($trip['patronId'] ?? '') !== $auth['userId']) {
                    JsonResponse::send(['error' => 'No autorizado'], 403);
                    return;
                }

                JsonResponse::send($this->reservations->findByTripId($tripId));
                return;
            }

            if ($userId !== '') {
                if ($userId !== $auth['userId']) {
                    JsonResponse::send(['error' => 'No autorizado'], 403);
                    return;
                }
                JsonResponse::send($this->reservations->findByUserId($userId));
                return;
            }

            JsonResponse::send([]);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function getById(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $reservation = $this->reservations->findById((string) ($params['id'] ?? ''));
        if (!$reservation) {
            JsonResponse::send([], 404);
            return;
        }

        $trip = $this->trips->findById((string) ($reservation['tripId'] ?? ''));
        $patronId = (string) ($trip['patronId'] ?? '');
        if ($auth['userId'] !== (string) $reservation['userId'] && $auth['userId'] !== $patronId) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        JsonResponse::send($reservation);
    }

    public function update(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $status = (string) ($request->body()['status'] ?? '');
        if (!in_array($status, ['pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed'], true)) {
            JsonResponse::send(['error' => 'Estado inválido'], 400);
            return;
        }

        $statusMap = ['approved' => 'confirmed', 'rejected' => 'cancelled'];
        $dbStatus = $statusMap[$status] ?? $status;

        $current = $this->reservations->findById((string) ($params['id'] ?? ''));
        if (!$current) {
            JsonResponse::send([], 404);
            return;
        }

        $trip = $this->trips->findById((string) ($current['tripId'] ?? ''));
        $isOwner = $auth['userId'] === (string) $current['userId'];
        $isPatron = $auth['userId'] === (string) ($trip['patronId'] ?? '');

        if (!$isOwner && !$isPatron) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        if ($isOwner && $dbStatus !== 'cancelled') {
            JsonResponse::send(['error' => 'Solo el capitan puede aprobar/rechazar/completar'], 403);
            return;
        }

        $ok = $this->reservations->updateStatus((string) $params['id'], $dbStatus);
        if (!$ok) {
            JsonResponse::send([], 404);
            return;
        }

        $updated = $this->reservations->findById((string) $params['id']);
        JsonResponse::send($updated ?? []);
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $current = $this->reservations->findById((string) ($params['id'] ?? ''));
        if (!$current) {
            JsonResponse::send([], 404);
            return;
        }

        if ($auth['userId'] !== (string) $current['userId']) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        $this->reservations->delete((string) $params['id']);
        JsonResponse::noContent();
    }
}
