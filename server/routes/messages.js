const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const requireAuth = require('../middleware/requireAuth');

const isMissingTableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === 'ER_NO_SUCH_TABLE' ||
    message.includes('no such table') ||
    message.includes("doesn't exist") ||
    message.includes('does not exist')
  );
};

const getConversationPeerId = async (conversationId, userId) => {
  const rows = await db.query(
    `SELECT user_id
     FROM conversation_participants
     WHERE conversation_id = ? AND user_id != ?
     LIMIT 1`,
    [conversationId, userId]
  );
  return Array.isArray(rows) && rows[0]?.user_id ? String(rows[0].user_id) : null;
};

const getBlockState = async (userId, otherUserId) => {
  try {
    const rows = await db.query(
      `SELECT blocker_id, blocked_user_id
       FROM user_blocks
       WHERE is_active = TRUE
         AND (
           (blocker_id = ? AND blocked_user_id = ?)
           OR
           (blocker_id = ? AND blocked_user_id = ?)
         )
       LIMIT 1`,
      [userId, otherUserId, otherUserId, userId]
    );

    const relation = Array.isArray(rows) ? rows[0] : null;
    return {
      blocked: Boolean(relation),
      blockedByMe: Boolean(relation && relation.blocker_id === userId),
      blockedByOther: Boolean(relation && relation.blocker_id === otherUserId),
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {blocked: false, blockedByMe: false, blockedByOther: false};
    }
    throw error;
  }
};

router.get('/conversations/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({ error: 'No autorizado para consultar conversaciones de otro usuario' });
    }

    const query = `
      SELECT DISTINCT
        c.id,
        c.trip_id,
        (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1) as other_user_id,
        (SELECT name FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1)) as other_user_name,
        (SELECT avatar FROM users WHERE id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != ? LIMIT 1)) as other_user_avatar,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = FALSE AND sender_id != ?) as unread_count,
        c.updated_at
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.conversation_id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = ?
      )
      ORDER BY c.updated_at DESC
    `;

    const results = await db.query(query, [userId, userId, userId, userId, userId]);
    res.json(results);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversation/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0, userId } = req.query;
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      return res.status(400).json({ error: 'Invalid conversationId' });
    }
    if (!userId || String(userId) !== String(req.auth?.userId || '')) {
      return res.status(403).json({ error: 'No autorizado para consultar estos mensajes' });
    }

    const participants = await db.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
      [conversationId, userId]
    );
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(403).json({ error: 'User not participant in conversation' });
    }

    const safeLimit = Number.parseInt(limit, 10) || 50;
    const safeOffset = Number.parseInt(offset, 10) || 0;

    const results = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [conversationId, safeLimit, safeOffset]
    );

    res.json(results.reverse());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', requireAuth, async (req, res) => {
  try {
    const { conversationId, senderId, content } = req.body;
    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (!conversationId || !senderId || !normalizedContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (String(req.auth?.userId || '') !== String(senderId)) {
      return res.status(403).json({ error: 'No autorizado para enviar en nombre de otro usuario' });
    }

    if (normalizedContent.length > 500) {
      return res.status(400).json({ error: 'Message too long' });
    }

    const participants = await db.query(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
      [conversationId, senderId]
    );

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(403).json({ error: 'User not participant in conversation' });
    }

    const otherUserId = await getConversationPeerId(conversationId, senderId);
    if (!otherUserId) {
      return res.status(400).json({ error: 'Conversation without valid recipient' });
    }

    const blockState = await getBlockState(senderId, otherUserId);
    if (blockState.blockedByMe) {
      return res.status(403).json({ error: 'Has bloqueado a este usuario. Desbloquealo para enviar mensajes.' });
    }
    if (blockState.blockedByOther) {
      return res.status(403).json({ error: 'No puedes enviar mensajes: este usuario te ha bloqueado.' });
    }

    const messageId = uuidv4();
    const now = new Date();

    await db.query(
      `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [messageId, conversationId, senderId, normalizedContent, false, now]
    );

    await db.query(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      [now, conversationId]
    );

    res.json({
      id: messageId,
      conversationId,
      senderId,
      content: normalizedContent,
      is_read: false,
      created_at: now,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/conversation', requireAuth, async (req, res) => {
  try {
    const { userId1, userId2, tripId } = req.body;
    const normalizedTripId = tripId ?? null;

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (String(req.auth?.userId || '') !== String(userId1)) {
      return res.status(403).json({ error: 'No autorizado para crear chat en nombre de otro usuario' });
    }

    if (userId1 === userId2) {
      return res.status(400).json({ error: 'Cannot create a conversation with the same user' });
    }

    const blockState = await getBlockState(userId1, userId2);
    if (blockState.blocked) {
      return res.status(403).json({ error: 'No se puede crear chat: existe un bloqueo entre usuarios.' });
    }

    const users = await db.query('SELECT id FROM users WHERE id IN (?, ?)', [userId1, userId2]);
    if (!Array.isArray(users) || users.length < 2) {
      return res.status(404).json({ error: 'One or more users not found' });
    }

    const checkQuery = normalizedTripId
      ? `
          SELECT c.id
          FROM conversations c
          JOIN conversation_participants cp1
            ON cp1.conversation_id = c.id AND cp1.user_id = ?
          JOIN conversation_participants cp2
            ON cp2.conversation_id = c.id AND cp2.user_id = ?
          WHERE c.trip_id = ?
          LIMIT 1
        `
      : `
          SELECT c.id
          FROM conversations c
          JOIN conversation_participants cp1
            ON cp1.conversation_id = c.id AND cp1.user_id = ?
          JOIN conversation_participants cp2
            ON cp2.conversation_id = c.id AND cp2.user_id = ?
          WHERE c.trip_id IS NULL
          LIMIT 1
        `;

    const checkParams = normalizedTripId
      ? [userId1, userId2, normalizedTripId]
      : [userId1, userId2];

    const existing = await db.query(checkQuery, checkParams);

    if (Array.isArray(existing) && existing.length > 0) {
      return res.json({ id: existing[0].id, created: false });
    }

    const conversationId = uuidv4();
    const now = new Date();

    await db.query(
      'INSERT INTO conversations (id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [conversationId, normalizedTripId, now, now]
    );

    await db.query(
      'INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)',
      [conversationId, userId1, now, conversationId, userId2, now]
    );

    res.status(201).json({ id: conversationId, created: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/block/status', requireAuth, async (req, res) => {
  try {
    const {userId, otherUserId} = req.query;
    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'userId y otherUserId son requeridos' });
    }
    if (String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({ error: 'No autorizado para consultar este estado de bloqueo' });
    }
    const state = await getBlockState(String(userId), String(otherUserId));
    return res.json(state);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/block', requireAuth, async (req, res) => {
  try {
    const {blockerId, blockedUserId, reason} = req.body || {};
    if (!blockerId || !blockedUserId) {
      return res.status(400).json({ error: 'blockerId y blockedUserId son requeridos' });
    }
    if (blockerId === blockedUserId) {
      return res.status(400).json({ error: 'No puedes bloquearte a ti mismo' });
    }
    if (String(req.auth?.userId || '') !== String(blockerId)) {
      return res.status(403).json({ error: 'No autorizado para bloquear en nombre de otro usuario' });
    }

    await db.query(
      `INSERT INTO user_blocks (blocker_id, blocked_user_id, reason, is_active)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         reason = VALUES(reason),
         is_active = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [blockerId, blockedUserId, reason || null]
    );

    return res.status(201).json({ok: true});
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({ error: 'Bloqueos no disponibles temporalmente' });
    }
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/block', requireAuth, async (req, res) => {
  try {
    const {blockerId, blockedUserId} = req.body || {};
    if (!blockerId || !blockedUserId) {
      return res.status(400).json({ error: 'blockerId y blockedUserId son requeridos' });
    }
    if (String(req.auth?.userId || '') !== String(blockerId)) {
      return res.status(403).json({ error: 'No autorizado para desbloquear en nombre de otro usuario' });
    }

    await db.query(
      `UPDATE user_blocks
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE blocker_id = ? AND blocked_user_id = ?`,
      [blockerId, blockedUserId]
    );

    return res.json({ok: true});
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({ error: 'Bloqueos no disponibles temporalmente' });
    }
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/report', requireAuth, async (req, res) => {
  try {
    const {reporterId, reportedUserId, conversationId, messageId, reason, details} = req.body || {};
    if (!reporterId || !reportedUserId || !reason) {
      return res.status(400).json({ error: 'reporterId, reportedUserId y reason son requeridos' });
    }
    if (reporterId === reportedUserId) {
      return res.status(400).json({ error: 'No puedes reportarte a ti mismo' });
    }
    if (String(req.auth?.userId || '') !== String(reporterId)) {
      return res.status(403).json({ error: 'No autorizado para reportar en nombre de otro usuario' });
    }

    const reportId = uuidv4();
    await db.query(
      `INSERT INTO user_reports
        (id, reporter_id, reported_user_id, conversation_id, message_id, reason, details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        reportId,
        reporterId,
        reportedUserId,
        conversationId || null,
        messageId || null,
        String(reason).slice(0, 120),
        details || null,
      ]
    );

    return res.status(201).json({id: reportId, status: 'open'});
  } catch (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({ error: 'Reportes no disponibles temporalmente' });
    }
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:messageId/read', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    await db.query(
      `UPDATE messages m
       JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
       SET m.is_read = TRUE
       WHERE m.id = ? AND cp.user_id = ?`,
      [messageId, String(req.auth?.userId || '')]
    );
    res.json({ id: messageId, is_read: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/conversation/:conversationId/read-all', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    if (!userId || String(req.auth?.userId || '') !== String(userId)) {
      return res.status(403).json({ error: 'No autorizado para marcar mensajes de otro usuario' });
    }
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
      [conversationId, userId]
    );
    res.json({ conversationId, status: 'all_read' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
