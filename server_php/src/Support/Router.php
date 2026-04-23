<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Support;

final class Router
{
    /** @var array<int, array{method:string,pattern:string,handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): void
    {
        $requestMethod = $request->method();
        $requestPath = rtrim($request->path(), '/') ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $requestMethod) {
                continue;
            }

            $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $route['pattern']);
            $regex = '#^' . rtrim((string) $regex, '/') . '$#';

            if (!preg_match($regex, $requestPath, $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (!is_int($key)) {
                    $params[$key] = $value;
                }
            }

            $handler = $route['handler'];
            $callable = \Closure::fromCallable($handler);
            $arity = (new \ReflectionFunction($callable))->getNumberOfParameters();

            if ($arity <= 0) {
                $handler();
                return;
            }

            if ($arity === 1) {
                $handler($request);
                return;
            }

            $handler($request, $params);
            return;
        }

        JsonResponse::send(['error' => 'Not Found', 'path' => $requestPath], 404);
    }
}
