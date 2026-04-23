#!/usr/bin/env php
<?php

declare(strict_types=1);

use BarcoStop\ServerPhp\Config\AppConfig;
use BarcoStop\ServerPhp\Config\Database;
use BarcoStop\ServerPhp\Services\JwtService;
use PHPSocketIO\SocketIO;
use Workerman\Lib\Timer;

require_once dirname(__DIR__) . '/vendor/autoload.php';

if (class_exists(\Dotenv\Dotenv::class) && file_exists(dirname(__DIR__) . '/.env')) {
    \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad();
}

$host = AppConfig::env('WS_HOST', '0.0.0.0') ?? '0.0.0.0';
$port = AppConfig::int('WS_PORT', 8081);
$io = new SocketIO($port);
$jwt = new JwtService();

$roomPrefix = static fn(string $conversationId): string => 'conversation:' . trim($conversationId);

$socketState = [];
$conversationState = [];
$conversationSubscribers = [];

$getPayloadField = static function ($payload, string $key): mixed {
    if (is_array($payload)) {
        return $payload[$key] ?? null;
    }
    if (is_object($payload) && property_exists($payload, $key)) {
        return $payload->{$key};
    }
    return null;
};

$getHandshakeToken = static function ($socket): string {
    $handshake = is_array($socket->handshake ?? null) ? $socket->handshake : [];

    $authToken = trim((string) ($handshake['auth']['token'] ?? ''));
    if ($authToken !== '') {
        return $authToken;
    }

    $queryToken = trim((string) ($handshake['query']['token'] ?? ''));
    if ($queryToken !== '') {
        return $queryToken;
    }

    $authorization = trim((string) ($handshake['headers']['authorization'] ?? ''));
    if (stripos($authorization, 'Bearer ') === 0) {
        return trim(substr($authorization, 7));
    }

    return '';
};

$io->on('connection', static function ($socket) use (&$socketState, &$conversationState, &$conversationSubscribers, $jwt, $roomPrefix, $getHandshakeToken, $getPayloadField): void {
    $token = $getHandshakeToken($socket);
    if ($token === '') {
        $socket->emit('error', ['error' => 'Token requerido para WebSocket']);
        $socket->disconnect();
        return;
    }

    try {
        $payload = $jwt->verifyToken($token);
    } catch (Throwable $e) {
        $socket->emit('error', ['error' => $e->getMessage() ?: 'Token invalido']);
        $socket->disconnect();
        return;
    }

    $socket->auth = [
        'userId' => (string) ($payload['userId'] ?? ''),
        'role' => $payload['role'] ?? null,
        'email' => $payload['email'] ?? null,
        'name' => $payload['name'] ?? null,
    ];

    $socketState[$socket->id] = [
        'joined' => [],
    ];

    $socket->on('conversation:join', static function ($payload = null, $ack = null) use ($socket, &$socketState, &$conversationState, &$conversationSubscribers, $roomPrefix, $getPayloadField): void {
        try {
            $conversationId = trim((string) $getPayloadField($payload, 'conversationId'));
            $userId = trim((string) ($socket->auth['userId'] ?? ''));

            if ($conversationId === '' || $userId === '') {
                if (is_callable($ack)) {
                    $ack(['ok' => false, 'error' => 'Datos invalidos para unirse al chat']);
                }
                return;
            }

            $exists = Database::fetchOne(
                'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
                [$conversationId, $userId]
            );

            if (!$exists) {
                if (is_callable($ack)) {
                    $ack(['ok' => false, 'error' => 'No autorizado para este chat']);
                }
                return;
            }

            $alreadyJoined = isset($socketState[$socket->id]['joined'][$conversationId]);
            $socket->join($roomPrefix($conversationId));
            $socketState[$socket->id]['joined'][$conversationId] = true;

            if (!$alreadyJoined) {
                $conversationSubscribers[$conversationId] = (int) ($conversationSubscribers[$conversationId] ?? 0) + 1;
            }

            if (!isset($conversationState[$conversationId])) {
                $last = Database::fetchOne(
                    'SELECT id, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
                    [$conversationId]
                );
                $conversationState[$conversationId] = [
                    'created_at' => (string) ($last['created_at'] ?? '1970-01-01 00:00:00'),
                    'id' => (string) ($last['id'] ?? ''),
                ];
            }

            if (is_callable($ack)) {
                $ack(['ok' => true, 'conversationId' => $conversationId]);
            }
        } catch (Throwable $e) {
            if (is_callable($ack)) {
                $ack(['ok' => false, 'error' => $e->getMessage() ?: 'No se pudo unir al chat']);
            }
        }
    });

    $socket->on('conversation:leave', static function ($payload = null) use ($socket, &$socketState, &$conversationState, &$conversationSubscribers, $roomPrefix, $getPayloadField): void {
        $conversationId = trim((string) $getPayloadField($payload, 'conversationId'));
        if ($conversationId === '') {
            return;
        }

        $socket->leave($roomPrefix($conversationId));
        $wasJoined = isset($socketState[$socket->id]['joined'][$conversationId]);
        unset($socketState[$socket->id]['joined'][$conversationId]);

        if ($wasJoined) {
            $conversationSubscribers[$conversationId] = max(0, (int) ($conversationSubscribers[$conversationId] ?? 0) - 1);
            if ($conversationSubscribers[$conversationId] === 0) {
                unset($conversationSubscribers[$conversationId], $conversationState[$conversationId]);
            }
        }
    });

    $socket->on('disconnect', static function () use ($socket, &$socketState, &$conversationState, &$conversationSubscribers): void {
        $joinedConversations = array_keys($socketState[$socket->id]['joined'] ?? []);
        foreach ($joinedConversations as $conversationId) {
            $conversationSubscribers[$conversationId] = max(0, (int) ($conversationSubscribers[$conversationId] ?? 0) - 1);
            if ($conversationSubscribers[$conversationId] === 0) {
                unset($conversationSubscribers[$conversationId], $conversationState[$conversationId]);
            }
        }
        unset($socketState[$socket->id]);
    });
});

Timer::add(1.0, static function () use (&$conversationState, $io, $roomPrefix): void {
    foreach (array_keys($conversationState) as $conversationId) {
        $cursor = $conversationState[$conversationId] ?? ['created_at' => '1970-01-01 00:00:00', 'id' => ''];
        $lastSeenAt = (string) ($cursor['created_at'] ?? '1970-01-01 00:00:00');
        $lastSeenId = (string) ($cursor['id'] ?? '');

        $rows = Database::fetchAll(
            'SELECT m.id, m.conversation_id AS conversationId, m.sender_id AS senderId, u.name AS senderName, m.content, m.is_read, m.created_at
             FROM messages m
             JOIN users u ON u.id = m.sender_id
             WHERE m.conversation_id = ?
               AND (m.created_at > ? OR (m.created_at = ? AND m.id > ?))
             ORDER BY m.created_at ASC, m.id ASC',
            [$conversationId, $lastSeenAt, $lastSeenAt, $lastSeenId]
        );

        if (empty($rows)) {
            continue;
        }

        foreach ($rows as $message) {
            $io->to($roomPrefix($conversationId))->emit('conversation:message', $message);
        }

        $latest = end($rows);
        $conversationState[$conversationId] = [
            'created_at' => (string) ($latest['created_at'] ?? $lastSeenAt),
            'id' => (string) ($latest['id'] ?? $lastSeenId),
        ];
    }
});

echo "Socket.IO server running on {$host}:{$port}\n";
Workerman\Worker::runAll();
