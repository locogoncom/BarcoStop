<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class AppVersionController
{
    public function __invoke(Request $request): void
    {
        JsonResponse::send([
            'latestVersion' => AppConfig::appLatestVersion(),
            'minSupportedVersion' => AppConfig::appMinSupportedVersion(),
            'forceUpdate' => AppConfig::appForceUpdate(),
            'androidStoreUrl' => AppConfig::appAndroidStoreUrl(),
            'iosStoreUrl' => AppConfig::appIosStoreUrl(),
            'message' => AppConfig::appVersionMessage(),
            'checkedAt' => gmdate(DATE_ATOM),
        ]);
    }
}
