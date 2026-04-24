<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Http\ApiKernel;
use BarcoStop\ServerPhp\Support\Request;
use BarcoStop\ServerPhp\Support\Router;
use PHPUnit\Framework\TestCase;

final class ApiMobileRequestsTest extends TestCase
{
    /**
     * Requests usadas por mobile/src/services/api.ts.
     * routePath usa placeholders para poder simular dinamicos.
     *
     * @var array<int, array{method:string,routePath:string,protected:bool}>
     */
    private const MOBILE_REQUESTS = [
        ['method' => 'GET', 'routePath' => '/', 'protected' => false],

        ['method' => 'POST', 'routePath' => '/api/v1/users', 'protected' => false],
        ['method' => 'GET', 'routePath' => '/api/v1/users', 'protected' => false],
        ['method' => 'POST', 'routePath' => '/api/v1/users/login', 'protected' => false],
        ['method' => 'GET', 'routePath' => '/api/v1/users/{userId}', 'protected' => false],
        ['method' => 'PATCH', 'routePath' => '/api/v1/users/{userId}', 'protected' => true],
        ['method' => 'PUT', 'routePath' => '/api/v1/users/{userId}', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/users/{userId}/avatar', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/users/avatar/{userId}', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/trips', 'protected' => false],
        ['method' => 'GET', 'routePath' => '/api/v1/trips/{tripId}', 'protected' => false],
        ['method' => 'POST', 'routePath' => '/api/v1/trips', 'protected' => true],
        ['method' => 'PATCH', 'routePath' => '/api/v1/trips/{tripId}', 'protected' => true],
        ['method' => 'DELETE', 'routePath' => '/api/v1/trips/{tripId}', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/trips/upload-image', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/boats', 'protected' => false],
        ['method' => 'GET', 'routePath' => '/api/v1/boats/{boatId}', 'protected' => false],
        ['method' => 'POST', 'routePath' => '/api/v1/boats', 'protected' => true],
        ['method' => 'PATCH', 'routePath' => '/api/v1/boats/{boatId}', 'protected' => true],
        ['method' => 'DELETE', 'routePath' => '/api/v1/boats/{boatId}', 'protected' => true],

        ['method' => 'POST', 'routePath' => '/api/v1/ratings', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/ratings/user/{userId}', 'protected' => false],
        ['method' => 'GET', 'routePath' => '/api/v1/ratings/from/{userId}', 'protected' => true],

        ['method' => 'POST', 'routePath' => '/api/v1/reservations', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/reservations', 'protected' => true],
        ['method' => 'PATCH', 'routePath' => '/api/v1/reservations/{reservationId}', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/messages/conversations/{userId}', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/messages/conversation/{conversationId}/messages', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/messages/send', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/messages/conversation', 'protected' => true],
        ['method' => 'PATCH', 'routePath' => '/api/v1/messages/{messageId}/read', 'protected' => true],
        ['method' => 'PATCH', 'routePath' => '/api/v1/messages/conversation/{conversationId}/read-all', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/messages/block/status', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/messages/block', 'protected' => true],
        ['method' => 'DELETE', 'routePath' => '/api/v1/messages/block', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/messages/report', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/messages/regatta/{tripId}/chat', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/messages/regatta/{tripId}/chat/messages', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/messages/regatta/{tripId}/chat/messages', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/favorites/{userId}', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/favorites', 'protected' => true],
        ['method' => 'DELETE', 'routePath' => '/api/v1/favorites/{userId}/{favoriteUserId}', 'protected' => true],

        ['method' => 'POST', 'routePath' => '/api/v1/donations', 'protected' => true],
        ['method' => 'GET', 'routePath' => '/api/v1/donations/user/{userId}', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/support-messages/user/{userId}', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/support-messages', 'protected' => true],
        ['method' => 'DELETE', 'routePath' => '/api/v1/support-messages/{id}', 'protected' => true],

        ['method' => 'GET', 'routePath' => '/api/v1/trip-checkpoints', 'protected' => true],
        ['method' => 'POST', 'routePath' => '/api/v1/trip-checkpoints', 'protected' => true],
    ];

    public function testMobileApiRoutesAreRegisteredInApiKernel(): void
    {
        $router = $this->buildRouterFromApiKernel();
        $routes = $this->registeredRoutes($router);

        foreach (self::MOBILE_REQUESTS as $request) {
            $method = $request['method'];
            $routePath = $request['routePath'];
            $samplePath = $this->materializePath($routePath);

            self::assertTrue(
                $this->matchesAnyRoute($routes, $method, $samplePath),
                sprintf('No existe ruta API para request mobile: %s %s', $method, $routePath)
            );
        }
    }

    public function testProtectedMobileRequestsReturn401WhenBearerTokenIsMissing(): void
    {
        $router = $this->buildRouterFromApiKernel();

        foreach (self::MOBILE_REQUESTS as $request) {
            if ($request['protected'] !== true) {
                continue;
            }

            $samplePath = $this->materializePath($request['routePath']);
            $response = $this->dispatch($router, $request['method'], $samplePath);
            $payload = json_decode($response['body'], true);

            self::assertSame(
                401,
                $response['status'],
                sprintf('Esperado 401 en %s %s sin token', $request['method'], $samplePath)
            );
            self::assertIsArray($payload, 'La respuesta protegida debe ser JSON');
            self::assertSame('Token requerido', $payload['error'] ?? null);
        }
    }

    public function testLiveLoginWithProvidedTestAccountWhenEnabled(): void
    {
        $enabled = getenv('BARCOSTOP_RUN_LIVE_AUTH_TEST') === '1';
        if (!$enabled) {
            $this->markTestSkipped('Test live desactivado. Exporta BARCOSTOP_RUN_LIVE_AUTH_TEST=1 para ejecutarlo.');
        }

        $baseUrl = rtrim((string) (getenv('BARCOSTOP_LIVE_API_BASE_URL') ?: 'https://api.barcostop.net/api/v1'), '/');
        $email = (string) (getenv('BARCOSTOP_TEST_EMAIL') ?: 'betolopezayesa@gmail.com');
        $password = (string) (getenv('BARCOSTOP_TEST_PASSWORD') ?: 'test22');

        $response = $this->httpJson('POST', $baseUrl . '/users/login', [
            'email' => $email,
            'password' => $password,
        ]);

        if ($response['networkError'] !== null) {
            $this->markTestSkipped('Sin conectividad para test live: ' . $response['networkError']);
        }

        self::assertSame(200, $response['status'], 'El login live debe responder 200 con la cuenta de prueba.');
        self::assertIsArray($response['json'], 'El login live debe devolver JSON');
        self::assertNotEmpty($response['json']['token'] ?? null, 'El login live debe devolver token');
        self::assertNotEmpty($response['json']['userId'] ?? null, 'El login live debe devolver userId');
    }

    private function buildRouterFromApiKernel(): Router
    {
        $router = new Router();
        $kernel = new ApiKernel();

        $method = new ReflectionMethod(ApiKernel::class, 'registerRoutes');
        $method->setAccessible(true);
        $method->invoke($kernel, $router);

        return $router;
    }

    /**
     * @return array<int, array{method:string,pattern:string}>
     */
    private function registeredRoutes(Router $router): array
    {
        $property = new ReflectionProperty(Router::class, 'routes');
        $property->setAccessible(true);
        $raw = $property->getValue($router);

        if (!is_array($raw)) {
            return [];
        }

        $routes = [];
        foreach ($raw as $row) {
            if (!is_array($row)) {
                continue;
            }
            $routes[] = [
                'method' => (string) ($row['method'] ?? ''),
                'pattern' => (string) ($row['pattern'] ?? ''),
            ];
        }

        return $routes;
    }

    /**
     * @param array<int, array{method:string,pattern:string}> $routes
     */
    private function matchesAnyRoute(array $routes, string $method, string $path): bool
    {
        $normalizedPath = $this->normalizePath($path);

        foreach ($routes as $route) {
            if (strtoupper($method) !== strtoupper($route['method'])) {
                continue;
            }

            $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '[^/]+', $route['pattern']);
            $regex = '#^' . $this->normalizePath((string) $regex) . '$#';

            if (preg_match($regex, $normalizedPath) === 1) {
                return true;
            }
        }

        return false;
    }

    private function normalizePath(string $path): string
    {
        $trimmed = trim($path);
        if ($trimmed === '') {
            return '/';
        }

        $onlyPath = (string) (parse_url($trimmed, PHP_URL_PATH) ?: '/');
        return rtrim($onlyPath, '/') ?: '/';
    }

    private function materializePath(string $routePath): string
    {
        $result = preg_replace('/\{[^}]+\}/', 'sample-id', $routePath);
        return is_string($result) ? $result : $routePath;
    }

    /**
     * @return array{status:int,body:string}
     */
    private function dispatch(Router $router, string $method, string $path): array
    {
        $this->resetHttpGlobals();

        $_SERVER['REQUEST_METHOD'] = strtoupper($method);
        $_SERVER['REQUEST_URI'] = $path;

        http_response_code(200);

        $request = new Request();
        ob_start();
        $router->dispatch($request);
        $body = (string) ob_get_clean();

        return [
            'status' => http_response_code(),
            'body' => $body,
        ];
    }

    private function resetHttpGlobals(): void
    {
        $_GET = [];
        $_POST = [];
        $_FILES = [];

        unset(
            $_SERVER['REQUEST_METHOD'],
            $_SERVER['REQUEST_URI'],
            $_SERVER['HTTP_AUTHORIZATION'],
            $_SERVER['CONTENT_TYPE']
        );
    }

    /**
     * @return array{status:int,body:string,json:array<string,mixed>|null,networkError:?string}
     */
    private function httpJson(string $method, string $url, array $payload = []): array
    {
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $body = is_string($body) ? $body : '{}';

        $context = stream_context_create([
            'http' => [
                'method' => strtoupper($method),
                'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 15,
            ],
        ]);

        $result = @file_get_contents($url, false, $context);
        $networkError = $result === false ? (error_get_last()['message'] ?? 'network error') : null;

        $status = 0;
        $headers = $http_response_header ?? [];
        if (is_array($headers) && isset($headers[0]) && preg_match('#\s(\d{3})\s#', (string) $headers[0], $m) === 1) {
            $status = (int) $m[1];
        }

        $text = is_string($result) ? $result : '';
        $json = json_decode($text, true);

        return [
            'status' => $status,
            'body' => $text,
            'json' => is_array($json) ? $json : null,
            'networkError' => $networkError,
        ];
    }
}
