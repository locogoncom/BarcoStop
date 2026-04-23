<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

final class MiscRepository extends BaseRepository
{
    public function createDonation(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO donations (id, user_id, amount, paypal_transaction_id, status) VALUES (?, ?, ?, ?, ?)',
            [$id, $payload['userId'], (float) $payload['amount'], $payload['paypalTransactionId'] ?? null, $payload['status'] ?? 'completed']
        );

        $row = $this->fetchOne('SELECT * FROM donations WHERE id = ?', [$id]);
        return $row ?? ['id' => $id];
    }

    public function getDonationsByUser(string $userId): array
    {
        return $this->fetchAll('SELECT * FROM donations WHERE user_id = ? ORDER BY created_at DESC', [$userId]);
    }

    public function getDonationTotal(string $userId): float
    {
        $row = $this->fetchOne('SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE user_id = ?', [$userId]);
        return (float) ($row['total'] ?? 0);
    }

    public function getFavorites(string $userId): array
    {
        return $this->fetchAll(
            'SELECT u.id, u.name, u.avatar, u.role, u.average_rating
             FROM favorites f JOIN users u ON u.id = f.favorite_user_id
             WHERE f.user_id = ?',
            [$userId]
        );
    }

    public function hasFavorite(string $userId, string $favoriteUserId): bool
    {
        return $this->fetchOne('SELECT id FROM favorites WHERE user_id = ? AND favorite_user_id = ?', [$userId, $favoriteUserId]) !== null;
    }

    public function addFavorite(string $userId, string $favoriteUserId): int
    {
        $this->execute('INSERT INTO favorites (user_id, favorite_user_id) VALUES (?, ?)', [$userId, $favoriteUserId]);
        $row = $this->fetchOne('SELECT LAST_INSERT_ID() AS id');
        return (int) ($row['id'] ?? 0);
    }

    public function removeFavorite(string $userId, string $favoriteUserId): bool
    {
        return $this->execute('DELETE FROM favorites WHERE user_id = ? AND favorite_user_id = ?', [$userId, $favoriteUserId]) > 0;
    }

    public function createSupportMessage(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO support_messages (id, user_id, message, admin_reply, status, replied_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $payload['userId'], $payload['message'], null, 'open', null]
        );

        $row = $this->fetchOne('SELECT * FROM support_messages WHERE id = ?', [$id]);
        return $row ?? ['id' => $id];
    }

    public function listSupportMessages(string $userId): array
    {
        return $this->fetchAll('SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at DESC', [$userId]);
    }

    public function deleteSupportMessage(string $id, string $userId): bool
    {
        return $this->execute('DELETE FROM support_messages WHERE id = ? AND user_id = ?', [$id, $userId]) > 0;
    }

    public function createTripCheckpoint(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO trip_checkpoints (id, trip_id, user_id, checkpoint_type, note) VALUES (?, ?, ?, ?, ?)',
            [$id, $payload['tripId'], $payload['userId'], $payload['checkpointType'], $payload['note'] ?? null]
        );

        $row = $this->fetchOne('SELECT * FROM trip_checkpoints WHERE id = ?', [$id]);
        return $row ?? ['id' => $id];
    }

    public function listTripCheckpoints(string $tripId, int $limit = 100): array
    {
        return $this->fetchAll('SELECT * FROM trip_checkpoints WHERE trip_id = ? ORDER BY created_at DESC LIMIT ?', [$tripId, $limit]);
    }

    public function createTracking(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO trip_tracking (id, trip_id, latitude, longitude, speed, heading, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $payload['tripId'],
                $payload['latitude'],
                $payload['longitude'],
                $payload['speed'] ?? null,
                $payload['heading'] ?? null,
                $payload['timestamp'] ?? date('Y-m-d H:i:s'),
            ]
        );

        $row = $this->fetchOne('SELECT * FROM trip_tracking WHERE id = ?', [$id]);
        return $row ?? ['id' => $id];
    }

    public function listTracking(string $tripId, int $limit = 100): array
    {
        return $this->fetchAll('SELECT * FROM trip_tracking WHERE trip_id = ? ORDER BY timestamp DESC LIMIT ?', [$tripId, $limit]);
    }

    public function lastTracking(string $tripId): ?array
    {
        return $this->fetchOne('SELECT * FROM trip_tracking WHERE trip_id = ? ORDER BY timestamp DESC LIMIT 1', [$tripId]);
    }

    public function createBoat(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO boats (id, patron_id, name, type, capacity, length, year_built, fuel_type, license_number, safety_equipment, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $payload['patronId'],
                $payload['name'],
                $payload['type'],
                (int) ($payload['capacity'] ?? 1),
                $payload['length'] ?? null,
                $payload['yearBuilt'] ?? null,
                $payload['fuelType'] ?? null,
                $payload['licenseNumber'] ?? null,
                json_encode($payload['safetyEquipment'] ?? [], JSON_UNESCAPED_UNICODE),
                $payload['description'] ?? '',
                'active',
            ]
        );

        $boat = $this->getBoatById($id);
        if (!$boat) {
            throw new \RuntimeException('No se pudo crear barco');
        }

        return $boat;
    }

    public function listBoats(array $filters): array
    {
        $sql = 'SELECT * FROM boats WHERE 1=1';
        $params = [];

        if (!empty($filters['patronId'])) {
            $sql .= ' AND patron_id = ?';
            $params[] = $filters['patronId'];
        }
        if (!empty($filters['status'])) {
            $sql .= ' AND status = ?';
            $params[] = $filters['status'];
        } else {
            $sql .= ' AND status = ?';
            $params[] = 'active';
        }
        if (!empty($filters['type'])) {
            $sql .= ' AND type LIKE ?';
            $params[] = '%' . $filters['type'] . '%';
        }

        $sql .= ' ORDER BY created_at DESC';
        $rows = $this->fetchAll($sql, $params);

        return array_map([$this, 'hydrateBoat'], $rows);
    }

    public function getBoatById(string $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM boats WHERE id = ?', [$id]);
        return $row ? $this->hydrateBoat($row) : null;
    }

    public function updateBoat(string $id, array $payload): ?array
    {
        $map = [
            'name' => 'name',
            'type' => 'type',
            'capacity' => 'capacity',
            'length' => 'length',
            'yearBuilt' => 'year_built',
            'fuelType' => 'fuel_type',
            'licenseNumber' => 'license_number',
            'description' => 'description',
            'status' => 'status',
        ];

        $fields = [];
        $params = [];
        foreach ($map as $key => $col) {
            if (array_key_exists($key, $payload)) {
                $fields[] = $col . ' = ?';
                $params[] = $payload[$key];
            }
        }

        if (array_key_exists('safetyEquipment', $payload)) {
            $fields[] = 'safety_equipment = ?';
            $params[] = json_encode($payload['safetyEquipment'] ?? [], JSON_UNESCAPED_UNICODE);
        }

        if (!empty($fields)) {
            $fields[] = 'updated_at = CURRENT_TIMESTAMP';
            $params[] = $id;
            $this->execute('UPDATE boats SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        }

        return $this->getBoatById($id);
    }

    public function deleteBoat(string $id): bool
    {
        return $this->execute('DELETE FROM boats WHERE id = ?', [$id]) > 0;
    }

    private function hydrateBoat(array $boat): array
    {
        $safety = [];
        if (!empty($boat['safety_equipment'])) {
            $decoded = json_decode((string) $boat['safety_equipment'], true);
            if (is_array($decoded)) {
                $safety = $decoded;
            }
        }

        return [
            'id' => (string) $boat['id'],
            'patronId' => (string) $boat['patron_id'],
            'name' => $boat['name'],
            'type' => $boat['type'],
            'capacity' => (int) $boat['capacity'],
            'length' => $boat['length'] !== null ? (float) $boat['length'] : null,
            'yearBuilt' => $boat['year_built'] !== null ? (int) $boat['year_built'] : null,
            'fuelType' => $boat['fuel_type'],
            'licenseNumber' => $boat['license_number'],
            'safetyEquipment' => $safety,
            'description' => $boat['description'],
            'status' => $boat['status'],
            'createdAt' => isset($boat['created_at']) ? strtotime((string) $boat['created_at']) * 1000 : (int) round(microtime(true) * 1000),
            'updatedAt' => isset($boat['updated_at']) ? strtotime((string) $boat['updated_at']) * 1000 : (int) round(microtime(true) * 1000),
        ];
    }
}
