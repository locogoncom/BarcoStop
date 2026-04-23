<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class SupportMessagesController
{
    public function __construct(private readonly MiscRepository $repo, private readonly AuthMiddleware $auth) {}

    public function listByUser(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        JsonResponse::send($this->repo->listSupportMessages($userId));
    }

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $userId = trim((string) ($body['userId'] ?? ''));
        $message = trim((string) ($body['message'] ?? ''));

        if ($userId === '' || $userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($message === '') { JsonResponse::send(['error' => 'Escribe un mensaje antes de enviarlo'], 400); return; }
        if (strlen($message) > 1500) { JsonResponse::send(['error' => 'El mensaje es demasiado largo. Maximo 1500 caracteres.'], 400); return; }

        try {
            JsonResponse::send($this->repo->createSupportMessage(['userId' => $userId, 'message' => $message]), 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function delete(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $deleted = $this->repo->deleteSupportMessage((string) ($params['id'] ?? ''), $auth['userId']);
        if (!$deleted) { JsonResponse::send(['error' => 'Mensaje no encontrado'], 404); return; }
        JsonResponse::noContent();
    }
}
