<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class HealthController
{
    public function __invoke(Request $request): void
    {
        JsonResponse::send(['status' => 'ok', 'message' => 'BarcoStop API PHP running']);
    }
}
