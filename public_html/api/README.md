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
- Compatibilidad: también acepta `GET /v1/...` y `GET /api/...` (redirigido internamente a `/api/v1/...`).
- Base recomendada en app móvil: `https://api.barcostop.net/api/v1`

## Apache (shared hosting)

- Este proyecto incluye `public_html/api/.htaccess` para enrutar todo a `public/index.php`.
- Permite desplegar en `public_html/api` sin necesidad de cambiar docroot a `public/`.

Incluye módulos: users, trips, reservations, messages, ratings, favorites, donations, support-messages, trip-checkpoints, tracking y boats.

## Realtime chat

Implementado con Socket.IO compatible con eventos actuales:

- `conversation:join`
- `conversation:leave`
- `conversation:message` (push)

## Cleanup de viajes caducados

- Script manual: `php bin/trip-cleanup.php`
- También se ejecuta automáticamente desde `bin/socket-server.php` cada hora (configurable):
  - `TRIP_CLEANUP_HOURS=8`
  - `TRIP_CLEANUP_INTERVAL_MS=3600000`

## Nota importante

Este directorio es el backend activo de BarcoStop y sustituye al backend legacy en Node.
