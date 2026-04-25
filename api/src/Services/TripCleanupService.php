<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Services;

use BarcoStop\ServerPhp\Config\Database;

final class TripCleanupService
{
    public static function run(int $hours = 8): void
    {
        $safeHours = max(1, $hours);
        $intervalExpr = 'INTERVAL ' . $safeHours . ' HOUR';

        $expiredWhere = "
            status = 'active'
            AND updated_at < DATE_SUB(NOW(), {$intervalExpr})
            AND TIMESTAMP(CONCAT(departure_date, ' ', departure_time)) < DATE_SUB(NOW(), {$intervalExpr})
        ";

        // Si hubo actividad (reservas no canceladas), cerrar viaje en vez de borrarlo.
        Database::execute(
            "
            UPDATE trips t
            SET t.status = 'completed'
            WHERE {$expiredWhere}
              AND EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.trip_id = t.id
                  AND r.status <> 'cancelled'
                LIMIT 1
              )
            "
        );

        // Borrar viajes realmente inactivos.
        Database::execute(
            "
            DELETE FROM trips
            WHERE {$expiredWhere}
              AND NOT EXISTS (
                SELECT 1
                FROM reservations r
                WHERE r.trip_id = trips.id
                  AND r.status <> 'cancelled'
                LIMIT 1
              )
            "
        );
    }
}
