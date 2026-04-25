#!/usr/bin/env php
<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Services\TripCleanupService;

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (class_exists(\Dotenv\Dotenv::class) && file_exists(dirname(__DIR__) . '/.env')) {
    \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();
}

$hours = AppConfig::int('TRIP_CLEANUP_HOURS', 8);
TripCleanupService::run($hours);

echo "Trip cleanup done (hours={$hours})\n";
