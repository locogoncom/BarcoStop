<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\UserRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class RatingsController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AuthMiddleware $auth
    ) {
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $userId = (string) ($body['userId'] ?? '');
        $ratedBy = (string) ($body['ratedBy'] ?? '');
        $rating = (int) ($body['rating'] ?? 0);

        if ($userId === '' || $ratedBy === '' || $rating <= 0) {
            JsonResponse::send(['error' => 'userId, ratedBy, and rating are required'], 400);
            return;
        }
        if ($userId === $ratedBy) {
            JsonResponse::send(['error' => 'No puedes calificarte a ti mismo'], 400);
            return;
        }
        if ($ratedBy !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }
        if ($rating < 1 || $rating > 5) {
            JsonResponse::send(['error' => 'rating must be between 1 and 5'], 400);
            return;
        }

        $exists = \BarcoStop\ServerPhp\Config\Database::fetchOne('SELECT id FROM ratings WHERE user_id = ? AND rated_by = ? LIMIT 1', [$userId, $ratedBy]);
        if ($exists) {
            JsonResponse::send(['error' => 'Ya has calificado a este usuario'], 409);
            return;
        }

        try {
            \BarcoStop\ServerPhp\Config\Database::execute(
                'INSERT INTO ratings (user_id, rated_by, rating, comment) VALUES (?, ?, ?, ?)',
                [$userId, $ratedBy, $rating, $body['comment'] ?? null]
            );
            $this->users->syncAverageRating($userId);

            $row = \BarcoStop\ServerPhp\Config\Database::fetchOne('SELECT * FROM ratings WHERE user_id = ? AND rated_by = ? ORDER BY created_at DESC LIMIT 1', [$userId, $ratedBy]);
            JsonResponse::send($row ?? [], 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function listByUser(Request $request, array $params): void
    {
        $userId = (string) ($params['userId'] ?? '');
        if ($userId === '') {
            JsonResponse::send(['error' => 'userId is required'], 400);
            return;
        }

        try {
            $ratings = \BarcoStop\ServerPhp\Config\Database::fetchAll('SELECT * FROM ratings WHERE user_id = ? ORDER BY created_at DESC', [$userId]);
            $avg = \BarcoStop\ServerPhp\Config\Database::fetchOne('SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE user_id = ?', [$userId]);
            JsonResponse::send([
                'ratings' => $ratings,
                'averageRating' => (float) ($avg['average'] ?? 0),
                'reviewCount' => (int) ($avg['count'] ?? 0),
            ]);
        } catch (\Throwable) {
            JsonResponse::send(['ratings' => [], 'averageRating' => 0, 'reviewCount' => 0]);
        }
    }

    public function listFromUser(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $userId = (string) ($params['userId'] ?? '');
        if ($userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        try {
            $rows = \BarcoStop\ServerPhp\Config\Database::fetchAll('SELECT * FROM ratings WHERE rated_by = ? ORDER BY created_at DESC', [$userId]);
            JsonResponse::send($rows);
        } catch (\Throwable) {
            JsonResponse::send([]);
        }
    }

    public function getById(Request $request, array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            JsonResponse::send(['error' => 'Rating ID is required'], 400);
            return;
        }

        $rating = \BarcoStop\ServerPhp\Config\Database::fetchOne('SELECT * FROM ratings WHERE id = ?', [$id]);
        if (!$rating) {
            JsonResponse::send(['error' => 'Rating not found'], 404);
            return;
        }

        JsonResponse::send($rating);
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $id = (int) ($params['id'] ?? 0);
        if ($id <= 0) {
            JsonResponse::send(['error' => 'Rating ID is required'], 400);
            return;
        }

        $rating = \BarcoStop\ServerPhp\Config\Database::fetchOne('SELECT * FROM ratings WHERE id = ?', [$id]);
        if (!$rating) {
            JsonResponse::send(['error' => 'Rating not found'], 404);
            return;
        }
        if ((string) ($rating['rated_by'] ?? '') !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado'], 403);
            return;
        }

        \BarcoStop\ServerPhp\Config\Database::execute('DELETE FROM ratings WHERE id = ?', [$id]);
        JsonResponse::noContent();
    }
}
