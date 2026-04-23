<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Http\ApiKernel;
use Dotenv\Dotenv;

require dirname(__DIR__) . '/vendor/autoload.php';

$envPath = dirname(__DIR__);
if (file_exists($envPath . '/.env')) {
    Dotenv::createImmutable($envPath)->safeLoad();
}

$kernel = new ApiKernel();
$kernel->run();
