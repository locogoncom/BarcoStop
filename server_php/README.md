# BarcoStop API PHP (`server_php`)

Backend API en PHP vanilla estructurado para BarcoStop.

## Objetivo

- Compatibilidad 1:1 con el backend actual en rutas/contratos.
- Nuevo versionado por prefijo: `/api/v1`.
- Proyecto aislado: **no cambia la app móvil ni el backend Node actual**.

## Stack

- PHP 8.2+
- PDO MySQL
- JWT (`firebase/php-jwt`)
- UUID (`ramsey/uuid`)
- `.env` (`vlucas/phpdotenv`)
- Socket.IO server PHP (`workerman/phpsocket.io`)

## Estructura

- `public/index.php`: entrada HTTP.
- `src/Http/ApiKernel.php`: router + wiring.
- `src/Http/Controllers/*`: controladores.
- `src/Repositories/*`: acceso a datos.
- `src/Services/*`: JWT y uploads.
- `bin/socket-server.php`: servidor Socket.IO realtime.
- `database/schema.sql`: esquema base.
- `bin/migrate.php`: aplica esquema.

## Configuración

1. Copia `.env.example` a `.env` y ajusta credenciales MySQL.
2. Instala dependencias:

```bash
cd server_php
composer install
```

3. Aplica esquema si hace falta:

```bash
php bin/migrate.php
```

4. Levanta API HTTP local:

```bash
./bin/dev-http.sh
```

5. Levanta Socket.IO en otro puerto:

```bash
php bin/socket-server.php
```

## Endpoints base

- Health: `GET /`
- API v1: `GET /api/v1/...`

Incluye módulos: users, trips, reservations, messages, ratings, favorites, donations, support-messages, trip-checkpoints, tracking y boats.

## Realtime chat

Implementado con Socket.IO compatible con eventos actuales:

- `conversation:join`
- `conversation:leave`
- `conversation:message` (push)

## Nota importante

Este directorio es completamente independiente. La app actual no se ha modificado para usarlo.
