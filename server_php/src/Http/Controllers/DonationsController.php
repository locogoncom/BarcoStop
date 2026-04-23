<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MiscRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class DonationsController
{
    public function __construct(private readonly MiscRepository $repo, private readonly AuthMiddleware $auth) {}

    public function create(Request $request): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $body = $request->body();
        $userId = (string) ($body['userId'] ?? '');
        $amount = (float) ($body['amount'] ?? 0);

        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        if ($userId === '' || $amount < 2.50) { JsonResponse::send(['error' => 'Monto mínimo €2.50 requerido'], 400); return; }

        try {
            $donation = $this->repo->createDonation([
                'userId' => $userId,
                'amount' => $amount,
                'paypalTransactionId' => $body['paypalTransactionId'] ?? null,
                'status' => 'completed',
            ]);
            JsonResponse::send($donation, 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 400);
        }
    }

    public function listByUser(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }

        $donations = $this->repo->getDonationsByUser($userId);
        $total = $this->repo->getDonationTotal($userId);
        JsonResponse::send(['donations' => $donations, 'total' => $total, 'count' => count($donations)]);
    }

    public function totalByUser(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request); if (!$auth) return;
        $userId = (string) ($params['userId'] ?? '');
        if ($userId !== $auth['userId']) { JsonResponse::send(['error' => 'No autorizado'], 403); return; }
        JsonResponse::send(['total' => $this->repo->getDonationTotal($userId)]);
    }
}
