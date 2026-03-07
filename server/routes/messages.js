const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/messages/conversations/:userId - Obtener conversaciones del usuario
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Obtener conversaciones donde el usuario participa
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

// GET /api/messages/conversation/:conversationId/messages - Obtener mensajes de una conversación
router.get('/conversation/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      return res.status(400).json({ error: 'Invalid conversationId' });
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

// POST /api/messages/send - Enviar un mensaje
router.post('/send', async (req, res) => {
  try {
    const { conversationId, senderId, content } = req.body;
    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    if (!conversationId || !senderId || !normalizedContent) {
      return res.status(400).json({ error: 'Missing required fields' });
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

// POST /api/messages/conversation - Crear o obtener conversación
router.post('/conversation', async (req, res) => {
  try {
    const { userId1, userId2, tripId } = req.body;
    const normalizedTripId = tripId ?? null;

    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (userId1 === userId2) {
      return res.status(400).json({ error: 'Cannot create a conversation with the same user' });
    }

    const users = await db.query('SELECT id FROM users WHERE id IN (?, ?)', [userId1, userId2]);
    if (!Array.isArray(users) || users.length < 2) {
      return res.status(404).json({ error: 'One or more users not found' });
    }

    const checkQuery = normalizedTripId
      ? `
          SELECT c.id FROM conversations c
          WHERE c.trip_id = ?
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp1
            WHERE cp1.conversation_id = c.id AND cp1.user_id = ?
          )
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = ?
          )
          AND (
            SELECT COUNT(*) FROM conversation_participants cp
            WHERE cp.conversation_id = c.id
          ) = 2
          LIMIT 1
        `
      : `
          SELECT c.id FROM conversations c
          WHERE c.trip_id IS NULL
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp1
            WHERE cp1.conversation_id = c.id AND cp1.user_id = ?
          )
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = ?
          )
          AND (
            SELECT COUNT(*) FROM conversation_participants cp
            WHERE cp.conversation_id = c.id
          ) = 2
          LIMIT 1
        `;

    const checkParams = normalizedTripId
      ? [normalizedTripId, userId1, userId2]
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

// PATCH /api/messages/:messageId/read - Marcar como leído
router.patch('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    await db.query('UPDATE messages SET is_read = TRUE WHERE id = ?', [messageId]);
    res.json({ id: messageId, is_read: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/messages/conversation/:conversationId/read-all - Marcar todos como leídos
router.patch('/conversation/:conversationId/read-all', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
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