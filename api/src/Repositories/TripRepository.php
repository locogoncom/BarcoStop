<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

use BarcoStop\ServerPhp\Support\Helpers;

final class TripRepository extends BaseRepository
{
    private function encodeTripMeta(mixed $tripMeta): ?string
    {
        if (is_array($tripMeta)) {
            $encoded = json_encode($tripMeta, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            return is_string($encoded) ? $encoded : null;
        }
        if (is_string($tripMeta)) {
            $trimmed = trim($tripMeta);
            if ($trimmed === '') return null;
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $encoded = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                return is_string($encoded) ? $encoded : null;
            }
        }
        return null;
    }

    private function decodeTripMeta(mixed $tripMetaRaw): array
    {
        if (is_array($tripMetaRaw)) {
            return $tripMetaRaw;
        }
        if (!is_string($tripMetaRaw) || trim($tripMetaRaw) === '') {
            return [];
        }
        $decoded = json_decode($tripMetaRaw, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function splitDescriptionAndMeta(?string $description): array
    {
        $raw = (string) ($description ?? '');
        $marker = '[BSMETA]';
        $idx = strpos($raw, $marker);
        if ($idx === false) {
            return ['plain' => $raw, 'meta' => []];
        }

        $plain = rtrim(substr($raw, 0, $idx));
        $rawMeta = trim(substr($raw, $idx + strlen($marker)));
        if ($rawMeta === '') {
            return ['plain' => $plain, 'meta' => []];
        }

        $meta = json_decode($rawMeta, true);
        if (!is_array($meta)) {
            return ['plain' => $plain, 'meta' => []];
        }

        return ['plain' => $plain, 'meta' => $meta];
    }

    public function create(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $route = $payload['route'] ?? [];

        $this->execute(
            'INSERT INTO trips (id, patron_id, origin, destination, departure_date, departure_time, estimated_duration, description, trip_meta, available_seats, cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $payload['patronId'] ?? null,
                $route['origin'] ?? null,
                $route['destination'] ?? null,
                $route['departureDate'] ?? null,
                $route['departureTime'] ?? null,
                $route['estimatedDuration'] ?? null,
                $payload['description'] ?? '',
                $this->encodeTripMeta($payload['tripMeta'] ?? null),
                (int) ($payload['availableSeats'] ?? 1),
                (float) ($payload['cost'] ?? 0),
                'active',
            ]
        );

        if (isset($payload['requiredSkills']) && is_array($payload['requiredSkills'])) {
            $this->replaceRequiredSkills($id, $payload['requiredSkills']);
        }

        $trip = $this->findById($id);
        if (!$trip) {
            throw new \RuntimeException('No se pudo crear viaje');
        }

        return $trip;
    }

    public function findById(string $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM trips WHERE id = ?', [$id]);
        if (!$row) {
            return null;
        }

        return $this->hydrateTrip($row);
    }

    public function findAll(array $filters = []): array
    {
        $sql = 'SELECT * FROM trips WHERE 1=1';
        $params = [];

        if (!empty($filters['patronId'])) {
            $sql .= ' AND patron_id = ?';
            $params[] = $filters['patronId'];
        }
        if (!empty($filters['origin'])) {
            $sql .= ' AND origin LIKE ?';
            $params[] = '%' . $filters['origin'] . '%';
        }
        if (!empty($filters['destination'])) {
            $sql .= ' AND destination LIKE ?';
            $params[] = '%' . $filters['destination'] . '%';
        }
        if (!empty($filters['status'])) {
            $sql .= ' AND status = ?';
            $params[] = $filters['status'];
        } else {
            $sql .= ' AND status = ?';
            $params[] = 'active';
        }
        if (!empty($filters['departureDate'])) {
            $sql .= ' AND departure_date >= ?';
            $params[] = $filters['departureDate'];
        }

        $sql .= ' ORDER BY departure_date ASC, departure_time ASC';

        $rows = $this->fetchAll($sql, $params);
        return array_map(fn(array $row): array => $this->hydrateTrip($row), $rows);
    }

    public function update(string $id, array $payload): ?array
    {
        $fields = [];
        $params = [];

        if (isset($payload['route']) && is_array($payload['route'])) {
            $routeMap = [
                'origin' => 'origin',
                'destination' => 'destination',
                'departureDate' => 'departure_date',
                'departureTime' => 'departure_time',
                'estimatedDuration' => 'estimated_duration',
            ];
            foreach ($routeMap as $key => $col) {
                if (array_key_exists($key, $payload['route'])) {
                    $fields[] = $col . ' = ?';
                    $params[] = $payload['route'][$key];
                }
            }
        }

        $map = [
            'description' => 'description',
            'tripMeta' => 'trip_meta',
            'availableSeats' => 'available_seats',
            'cost' => 'cost',
            'status' => 'status',
        ];
        foreach ($map as $key => $col) {
            if (array_key_exists($key, $payload)) {
                $fields[] = $col . ' = ?';
                if ($key === 'tripMeta') {
                    $params[] = $this->encodeTripMeta($payload[$key]);
                } else {
                    $params[] = $payload[$key];
                }
            }
        }

        if (!empty($fields)) {
            $params[] = $id;
            $this->execute('UPDATE trips SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        }

        if (array_key_exists('requiredSkills', $payload) && is_array($payload['requiredSkills'])) {
            $this->replaceRequiredSkills($id, $payload['requiredSkills']);
        }

        return $this->findById($id);
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM trips WHERE id = ?', [$id]);
    }

    public function replaceRequiredSkills(string $tripId, array $skills): void
    {
        $this->execute('DELETE FROM trip_required_skills WHERE trip_id = ?', [$tripId]);
        foreach ($skills as $skill) {
            if (!is_array($skill) || empty($skill['name']) || empty($skill['level'])) {
                continue;
            }
            $this->execute('INSERT INTO trip_required_skills (trip_id, name, level) VALUES (?, ?, ?)', [
                $tripId,
                (string) $skill['name'],
                (string) $skill['level'],
            ]);
        }
    }

    public function getRequiredSkills(string $tripId): array
    {
        return $this->fetchAll('SELECT name, level FROM trip_required_skills WHERE trip_id = ?', [$tripId]);
    }

    private function hydrateTrip(array $row): array
    {
        $descriptionData = $this->splitDescriptionAndMeta((string) ($row['description'] ?? ''));
        $legacyMeta = is_array($descriptionData['meta']) ? $descriptionData['meta'] : [];
        $columnMeta = $this->decodeTripMeta($row['trip_meta'] ?? null);
        $descriptionMeta = !empty($columnMeta) ? $columnMeta : $legacyMeta;
        $tripKind = (($descriptionMeta['tripKind'] ?? 'trip') === 'regatta') ? 'regatta' : 'trip';

        $trip = [
            'id' => (string) $row['id'],
            'patronId' => (string) $row['patron_id'],
            'origin' => $row['origin'],
            'destination' => $row['destination'],
            'departureDate' => $row['departure_date'],
            'departureTime' => $row['departure_time'],
            'estimatedDuration' => $row['estimated_duration'],
            'route' => [
                'origin' => $row['origin'],
                'destination' => $row['destination'],
                'departureDate' => $row['departure_date'],
                'departureTime' => $row['departure_time'],
                'estimatedDuration' => $row['estimated_duration'],
            ],
            'title' => $descriptionData['plain'] !== ''
                ? (string) $descriptionData['plain']
                : trim(((string) $row['origin']) . ' -> ' . ((string) $row['destination'])),
            'description' => (string) $descriptionData['plain'],
            'descriptionMeta' => $descriptionMeta,
            'tripKind' => $tripKind,
            'availableSeats' => (int) $row['available_seats'],
            'cost' => (float) $row['cost'],
            'status' => $row['status'],
            'createdAt' => Helpers::nowMillis($row['created_at'] ?? null),
            'updatedAt' => Helpers::nowMillis($row['updated_at'] ?? null),
            'requiredSkills' => $this->getRequiredSkills((string) $row['id']),
        ];

        $patron = $this->fetchOne('SELECT id, name, boat_name, boat_type, average_rating FROM users WHERE id = ?', [$row['patron_id']]);
        if ($patron) {
            $trip['patron'] = [
                'id' => (string) $patron['id'],
                'name' => $patron['name'],
                'boatName' => $patron['boat_name'],
                'boatType' => $patron['boat_type'],
                'averageRating' => (float) ($patron['average_rating'] ?? 0),
            ];
        }

        return $trip;
    }
}
