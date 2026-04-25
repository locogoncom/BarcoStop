<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

use BarcoStop\ServerPhp\Support\Helpers;

final class ReservationRepository extends BaseRepository
{
    public function create(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO reservations (id, trip_id, user_id, seats, status, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                $id,
                $payload['tripId'],
                $payload['userId'],
                (int) ($payload['seats'] ?? 1),
                $payload['status'] ?? 'pending',
                $payload['paymentStatus'] ?? 'pending',
            ]
        );

        $row = $this->findById($id);
        if (!$row) {
            throw new \RuntimeException('No se pudo crear reserva');
        }
        return $row;
    }

    public function findById(string $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM reservations WHERE id = ?', [$id]);
        return $row ? $this->hydrate($row) : null;
    }

    public function findByUserId(string $userId): array
    {
        $rows = $this->fetchAll(
            'SELECT r.*, t.origin, t.destination, t.departure_date, t.cost, u.name AS patron_name, u.email AS patron_email
             FROM reservations r
             LEFT JOIN trips t ON r.trip_id = t.id
             LEFT JOIN users u ON t.patron_id = u.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC',
            [$userId]
        );

        return array_map(fn(array $r): array => [
            ...$this->hydrate($r),
            'origin' => $r['origin'],
            'destination' => $r['destination'],
            'departureDate' => $r['departure_date'],
            'price' => isset($r['cost']) ? (float) $r['cost'] : null,
            'patronName' => $r['patron_name'],
            'patronEmail' => $r['patron_email'],
            'trip_id' => $r['trip_id'],
            'user_id' => $r['user_id'],
        ], $rows);
    }

    public function findByTripId(string $tripId): array
    {
        $rows = $this->fetchAll(
            'SELECT r.*, u.name AS user_name, u.email AS user_email, u.avatar AS user_avatar
             FROM reservations r LEFT JOIN users u ON r.user_id = u.id
             WHERE r.trip_id = ? ORDER BY r.created_at DESC',
            [$tripId]
        );

        return array_map(fn(array $r): array => [
            ...$this->hydrate($r),
            'userName' => $r['user_name'],
            'userEmail' => $r['user_email'],
            'userAvatar' => $r['user_avatar'],
        ], $rows);
    }

    public function existsForTripUser(string $tripId, string $userId): bool
    {
        $row = $this->fetchOne(
            'SELECT id FROM reservations WHERE trip_id = ? AND user_id = ? AND status IN ("pending", "confirmed") LIMIT 1',
            [$tripId, $userId]
        );
        return $row !== null;
    }

    public function updateStatus(string $id, string $status): bool
    {
        return $this->execute('UPDATE reservations SET status = ? WHERE id = ?', [$status, $id]) > 0;
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM reservations WHERE id = ?', [$id]);
    }

    private function hydrate(array $r): array
    {
        return [
            'id' => (string) $r['id'],
            'tripId' => (string) $r['trip_id'],
            'userId' => (string) $r['user_id'],
            'seats' => (int) $r['seats'],
            'status' => $r['status'],
            'paymentStatus' => $r['payment_status'],
            'createdAt' => Helpers::nowMillis($r['created_at'] ?? null),
            'updatedAt' => Helpers::nowMillis($r['updated_at'] ?? null),
        ];
    }
}
