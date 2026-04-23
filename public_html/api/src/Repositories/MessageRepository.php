<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Repositories;

final class MessageRepository extends BaseRepository
{
    public function listConversations(string $userId): array
    {
        return $this->fetchAll(
            'SELECT DISTINCT
               c.id,
               c.trip_id,
               (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1) AS other_user_id,
               (SELECT name FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1)) AS other_user_name,
               (SELECT avatar FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1)) AS other_user_avatar,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_time,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = FALSE AND sender_id != ?) AS unread_count,
               c.updated_at
             FROM conversations c
             LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
             WHERE cp.conversation_id IN (
               SELECT conversation_id FROM conversation_participants WHERE user_id = ?
             )
             ORDER BY c.updated_at DESC',
            [$userId, $userId, $userId, $userId, $userId]
        );
    }

    public function isConversationParticipant(string $conversationId, string $userId): bool
    {
        $row = $this->fetchOne(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
            [$conversationId, $userId]
        );
        return $row !== null;
    }

    public function listMessages(string $conversationId, int $limit, int $offset): array
    {
        $rows = $this->fetchAll(
            'SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = ?
             ORDER BY m.created_at DESC
             LIMIT ? OFFSET ?',
            [$conversationId, $limit, $offset]
        );
        return array_reverse($rows);
    }

    public function getConversationPeerId(string $conversationId, string $userId): ?string
    {
        $row = $this->fetchOne(
            'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ? LIMIT 1',
            [$conversationId, $userId]
        );
        return $row ? (string) $row['user_id'] : null;
    }

    public function getBlockState(string $userId, string $otherUserId): array
    {
        try {
            $row = $this->fetchOne(
                'SELECT blocker_id, blocked_user_id
                 FROM user_blocks
                 WHERE is_active = TRUE
                   AND ((blocker_id = ? AND blocked_user_id = ?) OR (blocker_id = ? AND blocked_user_id = ?))
                 LIMIT 1',
                [$userId, $otherUserId, $otherUserId, $userId]
            );
        } catch (\Throwable) {
            return ['blocked' => false, 'blockedByMe' => false, 'blockedByOther' => false];
        }

        return [
            'blocked' => $row !== null,
            'blockedByMe' => $row !== null && (string) $row['blocker_id'] === $userId,
            'blockedByOther' => $row !== null && (string) $row['blocker_id'] === $otherUserId,
        ];
    }

    public function createMessage(string $conversationId, string $senderId, string $content): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->execute(
            'INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$id, $conversationId, $senderId, $content, false, $now]
        );
        $this->execute('UPDATE conversations SET updated_at = ? WHERE id = ?', [$now, $conversationId]);

        return [
            'id' => $id,
            'conversationId' => $conversationId,
            'senderId' => $senderId,
            'content' => $content,
            'is_read' => false,
            'created_at' => $now,
        ];
    }

    public function findOrCreateConversation(string $userId1, string $userId2, ?string $tripId): array
    {
        $checkQuery = $tripId
            ? 'SELECT c.id FROM conversations c JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ? JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ? WHERE c.trip_id = ? LIMIT 1'
            : 'SELECT c.id FROM conversations c JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ? JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ? WHERE c.trip_id IS NULL LIMIT 1';

        $params = $tripId ? [$userId1, $userId2, $tripId] : [$userId1, $userId2];
        $existing = $this->fetchOne($checkQuery, $params);
        if ($existing) {
            return ['id' => (string) $existing['id'], 'created' => false];
        }

        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $this->execute('INSERT INTO conversations (id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [$id, $tripId, $now, $now]);
        $this->execute(
            'INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)',
            [$id, $userId1, $now, $id, $userId2, $now]
        );

        return ['id' => $id, 'created' => true];
    }

    public function usersExist(string $userId1, string $userId2): bool
    {
        $rows = $this->fetchAll('SELECT id FROM users WHERE id IN (?, ?)', [$userId1, $userId2]);
        return count($rows) >= 2;
    }

    public function markRead(string $messageId, string $readerId): void
    {
        $this->execute(
            'UPDATE messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
             SET m.is_read = TRUE WHERE m.id = ? AND cp.user_id = ?',
            [$messageId, $readerId]
        );
    }

    public function markConversationRead(string $conversationId, string $userId): void
    {
        $this->execute('UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE', [$conversationId, $userId]);
    }

    public function blockUser(string $blockerId, string $blockedUserId, ?string $reason): void
    {
        $this->execute(
            'INSERT INTO user_blocks (blocker_id, blocked_user_id, reason, is_active)
             VALUES (?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE reason = VALUES(reason), is_active = TRUE, updated_at = CURRENT_TIMESTAMP',
            [$blockerId, $blockedUserId, $reason]
        );
    }

    public function unblockUser(string $blockerId, string $blockedUserId): void
    {
        $this->execute(
            'UPDATE user_blocks SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE blocker_id = ? AND blocked_user_id = ?',
            [$blockerId, $blockedUserId]
        );
    }

    public function reportUser(array $payload): array
    {
        $id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute(
            'INSERT INTO user_reports (id, reporter_id, reported_user_id, conversation_id, message_id, reason, details, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, "open")',
            [
                $id,
                $payload['reporterId'],
                $payload['reportedUserId'],
                $payload['conversationId'] ?? null,
                $payload['messageId'] ?? null,
                substr((string) $payload['reason'], 0, 120),
                $payload['details'] ?? null,
            ]
        );

        return ['id' => $id, 'status' => 'open'];
    }

    public function getTrip(string $tripId): ?array
    {
        return $this->fetchOne('SELECT id, patron_id, departure_date, description FROM trips WHERE id = ? LIMIT 1', [$tripId]);
    }

    public function getRegattaChat(string $tripId): ?array
    {
        return $this->fetchOne('SELECT trip_id, conversation_id FROM regatta_chats WHERE trip_id = ? LIMIT 1', [$tripId]);
    }

    public function deleteRegattaChatCascade(string $tripId): void
    {
        $record = $this->getRegattaChat($tripId);
        if (!$record || empty($record['conversation_id'])) {
            return;
        }
        $this->execute('DELETE FROM regatta_chats WHERE trip_id = ?', [$tripId]);
        $this->execute('DELETE FROM conversations WHERE id = ?', [$record['conversation_id']]);
    }

    public function getActiveRegattaParticipants(string $tripId, string $ownerId): array
    {
        $rows = $this->fetchAll(
            'SELECT r.id AS reservation_id, r.user_id, r.status, r.created_at, u.name AS user_name, u.avatar AS user_avatar
             FROM reservations r JOIN users u ON u.id = r.user_id
             WHERE r.trip_id = ? AND r.status IN ("pending", "approved", "confirmed")
             ORDER BY r.created_at ASC',
            [$tripId]
        );

        $participants = [[
            'reservationId' => null,
            'userId' => (string) $ownerId,
            'userName' => 'Organizador',
            'userAvatar' => null,
            'status' => 'confirmed',
            'joinedAt' => null,
        ]];

        foreach ($rows as $row) {
            $participants[] = [
                'reservationId' => (string) ($row['reservation_id'] ?? ''),
                'userId' => (string) ($row['user_id'] ?? ''),
                'userName' => $row['user_name'] ?? 'Capitán',
                'userAvatar' => $row['user_avatar'] ?? null,
                'status' => (string) ($row['status'] ?? 'pending'),
                'joinedAt' => $row['created_at'] ?? null,
            ];
        }

        return $participants;
    }

    public function syncConversationParticipants(string $conversationId, array $participantIds): void
    {
        $rows = $this->fetchAll('SELECT user_id FROM conversation_participants WHERE conversation_id = ?', [$conversationId]);
        $existing = array_map(static fn(array $r): string => (string) $r['user_id'], $rows);

        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        foreach ($participantIds as $userId) {
            if (!in_array($userId, $existing, true)) {
                $this->execute('INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?)', [$conversationId, $userId, $now]);
            }
        }

        foreach ($existing as $existingId) {
            if (!in_array($existingId, $participantIds, true)) {
                $this->execute('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?', [$conversationId, $existingId]);
            }
        }
    }

    public function ensureRegattaConversation(string $tripId, array $participantIds): string
    {
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $existing = $this->getRegattaChat($tripId);
        if ($existing && !empty($existing['conversation_id'])) {
            $conversationId = (string) $existing['conversation_id'];
            $this->syncConversationParticipants($conversationId, $participantIds);
            return $conversationId;
        }

        $conversationId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->execute('INSERT INTO conversations (id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [$conversationId, $tripId, $now, $now]);
        $this->execute('INSERT INTO regatta_chats (trip_id, conversation_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [$tripId, $conversationId, $now, $now]);
        $this->syncConversationParticipants($conversationId, $participantIds);

        return $conversationId;
    }
}
