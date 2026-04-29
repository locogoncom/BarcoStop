<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Support\Helpers;
use BarcoStop\ServerPhp\Support\Request;
use BarcoStop\ServerPhp\Support\Router;

require_once __DIR__ . '/../../../api/src/Config/AppConfig.php';
require_once __DIR__ . '/../../../api/src/Support/Helpers.php';
require_once __DIR__ . '/../../../api/src/Support/Request.php';
require_once __DIR__ . '/../../../api/src/Support/JsonResponse.php';
require_once __DIR__ . '/../../../api/src/Support/Router.php';

function testAssertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function testAssertSame(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $message . ' | expected=' . var_export($expected, true) . ' actual=' . var_export($actual, true)
        );
    }
}

function testWithEnv(string $key, ?string $value, callable $fn): void
{
    $oldEnv = getenv($key);
    $hadEnv = $oldEnv !== false;
    $oldServer = $_SERVER[$key] ?? null;
    $oldEnvArray = $_ENV[$key] ?? null;
    $hadServer = array_key_exists($key, $_SERVER);
    $hadEnvArray = array_key_exists($key, $_ENV);

    if ($value === null) {
        putenv($key);
        unset($_SERVER[$key], $_ENV[$key]);
    } else {
        putenv($key . '=' . $value);
        $_SERVER[$key] = $value;
        $_ENV[$key] = $value;
    }

    try {
        $fn();
    } finally {
        if ($hadEnv) {
            putenv($key . '=' . $oldEnv);
        } else {
            putenv($key);
        }

        if ($hadServer) {
            $_SERVER[$key] = $oldServer;
        } else {
            unset($_SERVER[$key]);
        }

        if ($hadEnvArray) {
            $_ENV[$key] = $oldEnvArray;
        } else {
            unset($_ENV[$key]);
        }
    }
}

function testResetRequestGlobals(): void
{
    $_GET = [];
    $_POST = [];
    $_FILES = [];
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/';
    unset($_SERVER['CONTENT_TYPE'], $_SERVER['HTTP_AUTHORIZATION']);
}

function testCaptureOutput(callable $fn): string
{
    ob_start();
    $fn();
    return (string) ob_get_clean();
}
