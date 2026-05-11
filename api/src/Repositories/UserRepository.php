<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

use BarcoStop\ServerPhp\Support\Helpers;

final class UserRepository extends BaseRepository
{
    public function getReputationSnapshot(string $userId, ?array $userRow = null): array
    {
        $row = $userRow ?? $this->fetchOne('SELECT * FROM users WHERE id = ?', [$userId]);
        if (!$row) {
            return [
                'totalPoints' => 0,
                'rankName' => 'Marinero',
                'rankInsignia' => '·',
                'createdTrips' => 0,
                'completedTrips' => 0,
                'reviewCount' => 0,
                'profileComplete' => false,
            ];
        }

        $createdTrips = (int) (($this->fetchOne('SELECT COUNT(*) AS total FROM trips WHERE patron_id = ?', [$userId])['total'] ?? 0));
        $completedTrips = (int) (($this->fetchOne(
            "SELECT COUNT(*) AS total FROM trips WHERE patron_id = ? AND LOWER(COALESCE(status, '')) IN ('completed', 'completado', 'finished', 'done')",
            [$userId]
        )['total'] ?? 0));
        $reviewCount = (int) (($this->fetchOne('SELECT COUNT(*) AS total FROM ratings WHERE user_id = ?', [$userId])['total'] ?? 0));
        $ratingsRows = $this->fetchAll('SELECT rating FROM ratings WHERE user_id = ?', [$userId]);
        $ratingPoints = 0;
        foreach ($ratingsRows as $ratingRow) {
            $rating = (int) ($ratingRow['rating'] ?? 0);
            if ($rating <= 0) {
                continue;
            }
            $ratingPoints += min(10, $rating <= 5 ? $rating * 2 : $rating);
        }

        $profileComplete = $this->isProfileComplete($row);
        $totalPoints = ($profileComplete ? 25 : 0) + ($createdTrips * 10) + ($completedTrips * 15) + $ratingPoints;

        return [
            'totalPoints' => $totalPoints,
            'rankName' => $this->rankName($totalPoints),
            'rankInsignia' => $this->rankInsignia($totalPoints),
            'createdTrips' => $createdTrips,
            'completedTrips' => $completedTrips,
            'reviewCount' => $reviewCount,
            'profileComplete' => $profileComplete,
        ];
    }

    public function create(array $payload): string
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO users (id, name, email, password, role, avatar, bio, current_location, instagram, phone, languages, sailing_experience, certifications, preferred_routes, boat_name, boat_type, boat_model, boat_length_m, boat_capacity, boat_year, boat_license, boat_photo_1, boat_photo_2, boat_photo_3, home_port, captain_license) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $payload['name'] ?? null,
                $payload['email'] ?? null,
                $payload['password'],
                Helpers::normalizeRole($payload['role'] ?? null, false),
                $payload['avatar'] ?? null,
                $payload['bio'] ?? null,
                $payload['currentLocation'] ?? null,
                $payload['instagram'] ?? null,
                $payload['phone'] ?? null,
                $payload['languages'] ?? null,
                $payload['sailingExperience'] ?? null,
                $payload['certifications'] ?? null,
                $payload['preferredRoutes'] ?? null,
                $payload['boatName'] ?? null,
                $payload['boatType'] ?? null,
                $payload['boatModel'] ?? null,
                $payload['boatLengthM'] ?? null,
                $payload['boatCapacity'] ?? null,
                $payload['boatYear'] ?? null,
                $payload['boatLicense'] ?? null,
                $payload['boatPhoto1'] ?? null,
                $payload['boatPhoto2'] ?? null,
                $payload['boatPhoto3'] ?? null,
                $payload['homePort'] ?? null,
                $payload['captainLicense'] ?? null,
            ]
        );

        if (isset($payload['skills']) && is_array($payload['skills'])) {
            $this->replaceSkills($id, $payload['skills']);
        }

        return $id;
    }

    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne('SELECT * FROM users WHERE email = ?', [$email]);
    }

    public function findById(string $id): ?array
    {
        $row = $this->fetchOne('SELECT * FROM users WHERE id = ?', [$id]);
        if (!$row) {
            return null;
        }

        return $this->hydrateUser($row);
    }

    public function findAll(?string $role = null): array
    {
        $sql = 'SELECT * FROM users WHERE 1=1';
        $params = [];
        if ($role !== null && $role !== '') {
            $sql .= ' AND role = ?';
            $params[] = Helpers::normalizeRole($role, false);
        }

        $rows = $this->fetchAll($sql, $params);
        return array_map(fn(array $row) => $this->hydrateUser($row), $rows);
    }

    public function update(string $id, array $payload): ?array
    {
        $fields = [];
        $params = [];

        $map = [
            'name' => 'name',
            'email' => 'email',
            'avatar' => 'avatar',
            'bio' => 'bio',
            'currentLocation' => 'current_location',
            'instagram' => 'instagram',
            'phone' => 'phone',
            'languages' => 'languages',
            'sailingExperience' => 'sailing_experience',
            'certifications' => 'certifications',
            'preferredRoutes' => 'preferred_routes',
            'boatName' => 'boat_name',
            'boatType' => 'boat_type',
            'boatModel' => 'boat_model',
            'boatLengthM' => 'boat_length_m',
            'boatCapacity' => 'boat_capacity',
            'boatYear' => 'boat_year',
            'boatLicense' => 'boat_license',
            'boatPhoto1' => 'boat_photo_1',
            'boatPhoto2' => 'boat_photo_2',
            'boatPhoto3' => 'boat_photo_3',
            'homePort' => 'home_port',
            'captainLicense' => 'captain_license',
        ];

        foreach ($map as $key => $column) {
            if (array_key_exists($key, $payload)) {
                $fields[] = $column . ' = ?';
                $params[] = $payload[$key];
            }
        }

        if (array_key_exists('role', $payload)) {
            $fields[] = 'role = ?';
            $params[] = Helpers::normalizeRole($payload['role'], false);
        }

        if (!empty($fields)) {
            $params[] = $id;
            $this->execute('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        }

        if (array_key_exists('skills', $payload) && is_array($payload['skills'])) {
            $this->replaceSkills($id, $payload['skills']);
        }

        return $this->findById($id);
    }

    public function delete(string $id): void
    {
        $this->execute('DELETE FROM users WHERE id = ?', [$id]);
    }

    public function replaceSkills(string $userId, array $skills): void
    {
        $this->execute('DELETE FROM user_skills WHERE user_id = ?', [$userId]);
        foreach ($skills as $skill) {
            if (!is_array($skill) || empty($skill['name']) || empty($skill['level'])) {
                continue;
            }
            $this->execute('INSERT INTO user_skills (user_id, name, level) VALUES (?, ?, ?)', [
                $userId,
                (string) $skill['name'],
                (string) $skill['level'],
            ]);
        }
    }

    public function getSkills(string $userId): array
    {
        return $this->fetchAll('SELECT name, level FROM user_skills WHERE user_id = ?', [$userId]);
    }

    public function getRatings(string $userId): array
    {
        $rows = $this->fetchAll(
            'SELECT r.*, u.name AS rated_by_name FROM ratings r JOIN users u ON r.rated_by = u.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
            [$userId]
        );

        return array_map(static fn(array $r): array => [
            'rating' => (int) $r['rating'],
            'comment' => $r['comment'],
            'ratedBy' => (string) $r['rated_by'],
            'ratedByName' => $r['rated_by_name'],
            'createdAt' => Helpers::nowMillis($r['created_at'] ?? null),
        ], $rows);
    }

    public function addRating(string $userId, array $payload): void
    {
        $this->execute(
            'INSERT INTO ratings (user_id, rated_by, rating, comment) VALUES (?, ?, ?, ?)',
            [$userId, $payload['ratedBy'], (int) $payload['rating'], $payload['comment'] ?? null]
        );
        $this->syncAverageRating($userId);
    }

    public function syncAverageRating(string $userId): void
    {
        $row = $this->fetchOne('SELECT AVG(rating) AS avg_rating FROM ratings WHERE user_id = ?', [$userId]);
        $avg = (float) ($row['avg_rating'] ?? 0);
        $this->execute('UPDATE users SET average_rating = ? WHERE id = ?', [$avg, $userId]);
    }

    private function hydrateUser(array $row): array
    {
        $id = (string) $row['id'];
        $reputation = $this->getReputationSnapshot($id, $row);
        return [
            'id' => $id,
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => Helpers::normalizeRole($row['role'] ?? null, false),
            'avatar' => $row['avatar'],
            'bio' => $row['bio'],
            'currentLocation' => $row['current_location'],
            'instagram' => $row['instagram'],
            'phone' => $row['phone'],
            'languages' => $row['languages'],
            'sailingExperience' => $row['sailing_experience'],
            'certifications' => $row['certifications'],
            'preferredRoutes' => $row['preferred_routes'],
            'boatName' => $row['boat_name'],
            'boatType' => $row['boat_type'],
            'boatModel' => $row['boat_model'],
            'boatLengthM' => $row['boat_length_m'] === null ? null : (float) $row['boat_length_m'],
            'boatCapacity' => $row['boat_capacity'] === null ? null : (int) $row['boat_capacity'],
            'boatYear' => $row['boat_year'],
            'boatLicense' => $row['boat_license'],
            'boatPhoto1' => $row['boat_photo_1'],
            'boatPhoto2' => $row['boat_photo_2'],
            'boatPhoto3' => $row['boat_photo_3'],
            'homePort' => $row['home_port'],
            'captainLicense' => $row['captain_license'],
            'averageRating' => (float) ($row['average_rating'] ?? 0),
            'totalPoints' => $reputation['totalPoints'],
            'rankName' => $reputation['rankName'],
            'rankInsignia' => $reputation['rankInsignia'],
            'createdTrips' => $reputation['createdTrips'],
            'completedTrips' => $reputation['completedTrips'],
            'reviewCount' => $reputation['reviewCount'],
            'profileComplete' => $reputation['profileComplete'],
            'reputation' => $reputation,
            'createdAt' => Helpers::nowMillis($row['created_at'] ?? null),
            'updatedAt' => Helpers::nowMillis($row['updated_at'] ?? null),
            'skills' => $this->getSkills($id),
            'ratings' => $this->getRatings($id),
        ];
    }

    private function isProfileComplete(array $row): bool
    {
        $commonFields = [
            trim((string) ($row['name'] ?? '')),
            trim((string) ($row['bio'] ?? '')),
            trim((string) ($row['current_location'] ?? '')),
            trim((string) ($row['instagram'] ?? '')),
            trim((string) ($row['phone'] ?? '')),
            trim((string) ($row['languages'] ?? '')),
            trim((string) ($row['avatar'] ?? '')),
        ];

        foreach ($commonFields as $value) {
            if ($value === '') {
                return false;
            }
        }

        $isCaptain = Helpers::normalizeRole($row['role'] ?? null, false) === 'patron';
        $roleFields = $isCaptain
            ? [
                trim((string) ($row['boat_name'] ?? '')),
                trim((string) ($row['boat_type'] ?? '')),
                trim((string) ($row['boat_model'] ?? '')),
                trim((string) ($row['boat_length_m'] ?? '')),
                trim((string) ($row['boat_capacity'] ?? '')),
                trim((string) ($row['boat_year'] ?? '')),
                trim((string) ($row['boat_license'] ?? '')),
                trim((string) ($row['home_port'] ?? '')),
                trim((string) ($row['captain_license'] ?? '')),
            ]
            : [
                trim((string) ($row['sailing_experience'] ?? '')),
                trim((string) ($row['certifications'] ?? '')),
                trim((string) ($row['preferred_routes'] ?? '')),
            ];

        foreach ($roleFields as $value) {
            if ($value === '') {
                return false;
            }
        }

        return true;
    }

    private function rankName(int $totalPoints): string
    {
        if ($totalPoints >= 100) return 'Capitan';
        if ($totalPoints >= 75) return 'Oficial';
        if ($totalPoints >= 50) return 'Contramaestre';
        if ($totalPoints >= 25) return 'Marinero avanzado';
        return 'Marinero';
    }

    private function rankInsignia(int $totalPoints): string
    {
        if ($totalPoints >= 100) return '⚓⚓⚓⚓';
        if ($totalPoints >= 75) return '⚓⚓⚓';
        if ($totalPoints >= 50) return '⚓⚓';
        if ($totalPoints >= 25) return '⚓';
        return '·';
    }
}
