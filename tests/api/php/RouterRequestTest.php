<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Support\Request;
use BarcoStop\ServerPhp\Support\Router;

return [
    [
        'name' => 'Request lee method/path/query/header/bearer token',
        'fn' => static function (): void {
            testResetRequestGlobals();
            $_GET['limit'] = '6';
            $_SERVER['REQUEST_METHOD'] = 'PATCH';
            $_SERVER['REQUEST_URI'] = '/api/v1/messages?limit=6';
            $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer token-123';

            $request = new Request();

            testAssertSame('PATCH', $request->method(), 'method');
            testAssertSame('/api/v1/messages', $request->path(), 'path');
            testAssertSame('6', $request->query('limit'), 'query');
            testAssertSame('token-123', $request->bearerToken(), 'bearer token');
        },
    ],
    [
        'name' => 'Router resuelve params dinamicos',
        'fn' => static function (): void {
            testResetRequestGlobals();
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $_SERVER['REQUEST_URI'] = '/api/v1/users/u-123';

            $request = new Request();
            $router = new Router();
            $captured = [];

            $router->add('GET', '/api/v1/users/{id}', static function (Request $req, array $params) use (&$captured): void {
                $captured = [
                    'path' => $req->path(),
                    'id' => $params['id'] ?? null,
                ];
            });

            $output = testCaptureOutput(static function () use ($router, $request): void {
                http_response_code(200);
                $router->dispatch($request);
            });

            testAssertSame('', $output, 'No debe imprimir en handler custom');
            testAssertSame('/api/v1/users/u-123', $captured['path'] ?? null, 'Path capturado');
            testAssertSame('u-123', $captured['id'] ?? null, 'Param id capturado');
        },
    ],
    [
        'name' => 'Router responde 404 JSON cuando no hay ruta',
        'fn' => static function (): void {
            testResetRequestGlobals();
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $_SERVER['REQUEST_URI'] = '/api/v1/not-found';

            $request = new Request();
            $router = new Router();

            $output = testCaptureOutput(static function () use ($router, $request): void {
                http_response_code(200);
                $router->dispatch($request);
            });

            $decoded = json_decode($output, true);

            testAssertSame(404, http_response_code(), 'Debe devolver 404');
            testAssertSame('/api/v1/not-found', $decoded['path'] ?? null, 'Debe incluir path');
            testAssertSame('Not Found', $decoded['error'] ?? null, 'Debe incluir error');
        },
    ],
];
