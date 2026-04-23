<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class FavoritesController
{
    public function __construct(private readonly MiscRepository $repo, private readonly AuthMiddleware $auth) {}

    public function list(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        JsonResponse::send($this->repo->getFavorites($userId));
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $userId = (string) ($body['userId'] ?? '');
        $favoriteUserId = (string) ($body['favoriteUserId'] ?? '');

        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($userId === '' || $favoriteUserId === '') { JsonResponse::send(['error' => 'userId and favoriteUserId are required'], 400); return; }
        if ($userId === $favoriteUserId) { JsonResponse::send(['error' => 'Cannot add yourself to favorites'], 400); return; }
        if ($this->repo->hasFavorite($userId, $favoriteUserId)) { JsonResponse::send(['error' => 'User already in favorites'], 400); return; }

        try {
            $id = $this->repo->addFavorite($userId, $favoriteUserId);
            JsonResponse::send(['id' => $id, 'message' => 'Added to favorites'], 201);
        } catch (\Throwable) {
            JsonResponse::send(['error' => 'Failed to add favorite'], 500);
        }
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        $favoriteUserId = (string) ($params['favoriteUserId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($userId === '' || $favoriteUserId === '') { JsonResponse::send(['error' => 'userId and favoriteUserId are required'], 400); return; }

        $removed = $this->repo->removeFavorite($userId, $favoriteUserId);
        if (!$removed) { JsonResponse::send(['error' => 'Favorite not found'], 404); return; }
        JsonResponse::send(['message' => 'Removed from favorites']);
    }

    public function check(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        $favoriteUserId = (string) ($params['favoriteUserId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($userId === '' || $favoriteUserId === '') { JsonResponse::send(['error' => 'userId and favoriteUserId are required'], 400); return; }

        JsonResponse::send(['isFavorite' => $this->repo->hasFavorite($userId, $favoriteUserId)]);
    }
}
