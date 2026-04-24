<?php

declare(strict_types=1);

namespace BarcoStop\ServerPhp\Http\Controllers;

use BarcoStop\ServerPhp\Http\Middleware\AuthMiddleware;
use BarcoStop\ServerPhp\Repositories\MessageRepository;
use BarcoStop\ServerPhp\Support\JsonResponse;
use BarcoStop\ServerPhp\Support\Request;

final class MessagesController
{
    public function __construct(
        private readonly MessageRepository $messages,
        private readonly AuthMiddleware $auth
    ) {
    }

    public function listConversations(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $userId = (string) ($params['userId'] ?? '');
        if ($auth['userId'] !== $userId) {
            JsonResponse::send(['error' => 'No autorizado para consultar conversaciones de otro usuario'], 403);
            return;
        }

        try {
            JsonResponse::send($this->messages->listConversations($userId));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function listMessages(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $conversationId = (string) ($params['conversationId'] ?? '');
        $userId = (string) ($request->query('userId') ?? '');
        $limit = (int) ($request->query('limit') ?? 50);
        $offset = (int) ($request->query('offset') ?? 0);

        if ($conversationId === '' || $conversationId === 'undefined' || $conversationId === 'null') {
            JsonResponse::send(['error' => 'Invalid conversationId'], 400);
            return;
        }
        if ($userId === '' || $userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para consultar estos mensajes'], 403);
            return;
        }

        if (!$this->messages->isConversationParticipant($conversationId, $userId)) {
            JsonResponse::send(['error' => 'User not participant in conversation'], 403);
            return;
        }

        try {
            JsonResponse::send($this->messages->listMessages($conversationId, max(1, $limit), max(0, $offset)));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function send(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $conversationId = (string) ($body['conversationId'] ?? '');
        $senderId = (string) ($body['senderId'] ?? '');
        $content = trim((string) ($body['content'] ?? ''));

        if ($conversationId === '' || $senderId === '' || $content === '') {
            JsonResponse::send(['error' => 'Missing required fields'], 400);
            return;
        }
        if ($senderId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para enviar en nombre de otro usuario'], 403);
            return;
        }
        if (strlen($content) > 500) {
            JsonResponse::send(['error' => 'Message too long'], 400);
            return;
        }

        if (!$this->messages->isConversationParticipant($conversationId, $senderId)) {
            JsonResponse::send(['error' => 'User not participant in conversation'], 403);
            return;
        }

        $otherUserId = $this->messages->getConversationPeerId($conversationId, $senderId);
        if (!$otherUserId) {
            JsonResponse::send(['error' => 'Conversation without valid recipient'], 400);
            return;
        }

        $blockState = $this->messages->getBlockState($senderId, $otherUserId);
        if (($blockState['blockedByMe'] ?? false) === true) {
            JsonResponse::send(['error' => 'Has bloqueado a este usuario. Desbloquealo para enviar mensajes.'], 403);
            return;
        }
        if (($blockState['blockedByOther'] ?? false) === true) {
            JsonResponse::send(['error' => 'No puedes enviar mensajes: este usuario te ha bloqueado.'], 403);
            return;
        }

        try {
            $message = $this->messages->createMessage($conversationId, $senderId, $content);
            $message['senderName'] = $auth['name'] ?? null;
            JsonResponse::send($message);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function createConversation(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $userId1 = (string) ($body['userId1'] ?? '');
        $userId2 = (string) ($body['userId2'] ?? '');
        $tripId = isset($body['tripId']) && $body['tripId'] !== '' ? (string) $body['tripId'] : null;

        if ($userId1 === '' || $userId2 === '') {
            JsonResponse::send(['error' => 'Missing required fields'], 400);
            return;
        }
        if ($userId1 !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para crear chat en nombre de otro usuario'], 403);
            return;
        }
        if ($userId1 === $userId2) {
            JsonResponse::send(['error' => 'Cannot create a conversation with the same user'], 400);
            return;
        }

        $blockState = $this->messages->getBlockState($userId1, $userId2);
        if (($blockState['blocked'] ?? false) === true) {
            JsonResponse::send(['error' => 'No se puede crear chat: existe un bloqueo entre usuarios.'], 403);
            return;
        }

        if (!$this->messages->usersExist($userId1, $userId2)) {
            JsonResponse::send(['error' => 'One or more users not found'], 404);
            return;
        }

        try {
            $result = $this->messages->findOrCreateConversation($userId1, $userId2, $tripId);
            JsonResponse::send($result, $result['created'] ? 201 : 200);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    private function parseTripKind(string $description): string
    {
        $marker = "\n[BSMETA]";
        $idx = strpos($description, $marker);
        if ($idx === false) {
            return 'trip';
        }

        $raw = trim(substr($description, $idx + strlen($marker)));
        $meta = json_decode($raw, true);
        if (!is_array($meta)) {
            return 'trip';
        }

        return (($meta['tripKind'] ?? 'trip') === 'regatta') ? 'regatta' : 'trip';
    }

    private function resolveRegattaContext(string $tripId, string $userId): array
    {
        $trip = $this->messages->getTrip($tripId);
        if (!$trip) {
            return ['status' => 404, 'error' => 'Regata no encontrada'];
        }

        if ($this->parseTripKind((string) ($trip['description'] ?? '')) !== 'regatta') {
            return ['status' => 400, 'error' => 'Este viaje no es una regata'];
        }

        $rawDate = (string) ($trip['departure_date'] ?? '');
        if ($rawDate !== '') {
            $tripDate = strtotime($rawDate . ' 23:59:59');
            if ($tripDate !== false && $tripDate < time()) {
                $this->messages->deleteRegattaChatCascade($tripId);
                return ['status' => 410, 'error' => 'El chat de esta regata ya ha caducado'];
            }
        }

        $participants = $this->messages->getActiveRegattaParticipants($tripId, (string) $trip['patron_id']);
        $participantIds = array_values(array_unique(array_filter(array_map(
            static fn(array $p): string => (string) ($p['userId'] ?? ''),
            $participants
        ))));

        if (!in_array($userId, $participantIds, true)) {
            return ['status' => 403, 'error' => 'No perteneces al chat de esta regata'];
        }

        $conversationId = $this->messages->ensureRegattaConversation($tripId, $participantIds);
        return [
            'trip' => $trip,
            'participants' => $participants,
            'participantIds' => $participantIds,
            'conversationId' => $conversationId,
        ];
    }

    public function getRegattaChat(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $tripId = (string) ($params['tripId'] ?? '');
        $userId = (string) ($request->query('userId') ?? '');

        if ($userId === '' || $userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para consultar este chat de regata'], 403);
            return;
        }

        $context = $this->resolveRegattaContext($tripId, $userId);
        if (!empty($context['error'])) {
            JsonResponse::send(['error' => $context['error']], (int) ($context['status'] ?? 400));
            return;
        }

        JsonResponse::send([
            'conversationId' => $context['conversationId'],
            'participants' => $context['participants'],
        ]);
    }

    public function getRegattaMessages(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $tripId = (string) ($params['tripId'] ?? '');
        $userId = (string) ($request->query('userId') ?? '');
        $limit = (int) ($request->query('limit') ?? 100);
        $offset = (int) ($request->query('offset') ?? 0);

        if ($userId === '' || $userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para consultar este chat de regata'], 403);
            return;
        }

        $context = $this->resolveRegattaContext($tripId, $userId);
        if (!empty($context['error'])) {
            JsonResponse::send(['error' => $context['error']], (int) ($context['status'] ?? 400));
            return;
        }

        try {
            JsonResponse::send($this->messages->listMessages((string) $context['conversationId'], max(1, $limit), max(0, $offset)));
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function sendRegattaMessage(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $tripId = (string) ($params['tripId'] ?? '');
        $body = $request->body();
        $userId = (string) ($body['userId'] ?? '');
        $content = trim((string) ($body['content'] ?? ''));

        if ($userId === '' || $userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para enviar en este chat de regata'], 403);
            return;
        }
        if ($content === '') {
            JsonResponse::send(['error' => 'Mensaje vacio'], 400);
            return;
        }

        $context = $this->resolveRegattaContext($tripId, $userId);
        if (!empty($context['error'])) {
            JsonResponse::send(['error' => $context['error']], (int) ($context['status'] ?? 400));
            return;
        }

        try {
            $message = $this->messages->createMessage((string) $context['conversationId'], $userId, $content);
            $message['senderName'] = $auth['name'] ?? null;
            JsonResponse::send($message, 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function blockStatus(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $userId = (string) ($request->query('userId') ?? '');
        $otherUserId = (string) ($request->query('otherUserId') ?? '');

        if ($userId === '' || $otherUserId === '') {
            JsonResponse::send(['error' => 'userId y otherUserId son requeridos'], 400);
            return;
        }
        if ($userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para consultar este estado de bloqueo'], 403);
            return;
        }

        JsonResponse::send($this->messages->getBlockState($userId, $otherUserId));
    }

    public function block(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $blockerId = (string) ($body['blockerId'] ?? '');
        $blockedUserId = (string) ($body['blockedUserId'] ?? '');
        $reason = isset($body['reason']) ? (string) $body['reason'] : null;

        if ($blockerId === '' || $blockedUserId === '') {
            JsonResponse::send(['error' => 'blockerId y blockedUserId son requeridos'], 400);
            return;
        }
        if ($blockerId === $blockedUserId) {
            JsonResponse::send(['error' => 'No puedes bloquearte a ti mismo'], 400);
            return;
        }
        if ($blockerId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para bloquear en nombre de otro usuario'], 403);
            return;
        }

        try {
            $this->messages->blockUser($blockerId, $blockedUserId, $reason);
            JsonResponse::send(['ok' => true], 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => 'Bloqueos no disponibles temporalmente'], 503);
        }
    }

    public function unblock(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $blockerId = (string) ($body['blockerId'] ?? '');
        $blockedUserId = (string) ($body['blockedUserId'] ?? '');

        if ($blockerId === '' || $blockedUserId === '') {
            JsonResponse::send(['error' => 'blockerId y blockedUserId son requeridos'], 400);
            return;
        }
        if ($blockerId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para desbloquear en nombre de otro usuario'], 403);
            return;
        }

        try {
            $this->messages->unblockUser($blockerId, $blockedUserId);
            JsonResponse::send(['ok' => true]);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => 'Bloqueos no disponibles temporalmente'], 503);
        }
    }

    public function report(Request $request): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $reporterId = (string) ($body['reporterId'] ?? '');
        $reportedUserId = (string) ($body['reportedUserId'] ?? '');
        $reason = (string) ($body['reason'] ?? '');

        if ($reporterId === '' || $reportedUserId === '' || $reason === '') {
            JsonResponse::send(['error' => 'reporterId, reportedUserId y reason son requeridos'], 400);
            return;
        }
        if ($reporterId === $reportedUserId) {
            JsonResponse::send(['error' => 'No puedes reportarte a ti mismo'], 400);
            return;
        }
        if ($reporterId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para reportar en nombre de otro usuario'], 403);
            return;
        }

        try {
            JsonResponse::send($this->messages->reportUser($body), 201);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => 'Reportes no disponibles temporalmente'], 503);
        }
    }

    public function markRead(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        try {
            $id = (string) ($params['messageId'] ?? '');
            $this->messages->markRead($id, $auth['userId']);
            JsonResponse::send(['id' => $id, 'is_read' => true]);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }

    public function markConversationRead(Request $request, array $params): void
    {
        $auth = $this->auth->requireAuth($request);
        if (!$auth) return;

        $body = $request->body();
        $userId = (string) ($body['userId'] ?? '');
        if ($userId === '' || $userId !== $auth['userId']) {
            JsonResponse::send(['error' => 'No autorizado para marcar mensajes de otro usuario'], 403);
            return;
        }

        try {
            $this->messages->markConversationRead((string) ($params['conversationId'] ?? ''), $userId);
            JsonResponse::send(['conversationId' => (string) ($params['conversationId'] ?? ''), 'status' => 'all_read']);
        } catch (\Throwable $e) {
            JsonResponse::send(['error' => $e->getMessage()], 500);
        }
    }
}
