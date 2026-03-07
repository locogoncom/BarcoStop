const { query, queryOne } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class Message {
  // Crear un nuevo mensaje
  static async create(messageData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO messages (id, conversation_id, sender_id, content, is_read)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      messageData.conversationId,
      messageData.senderId,
      messageData.content,
      false
    ];
    
    await query(sql, params);
    return this.findById(id);
  }

  // Buscar mensaje por ID
  static async findById(id) {
    const message = await queryOne('SELECT * FROM messages WHERE id = ?', [id]);
    if (!message) return null;
    return this.formatMessage(message);
  }

  // Obtener mensajes de una conversación
  static async findByConversation(conversationId, limit = 50) {
    const sql = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `;
    
    const messages = await query(sql, [conversationId, limit]);
    return messages.map(m => ({
      ...this.formatMessage(m),
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar
    })).reverse();
  }

  // Marcar mensaje como leído
  static async markAsRead(id) {
    await query('UPDATE messages SET is_read = ? WHERE id = ?', [true, id]);
    return this.findById(id);
  }

  // Marcar todos los mensajes de una conversación como leídos
  static async markAllAsRead(conversationId, exceptSenderId) {
    await query(
      'UPDATE messages SET is_read = ? WHERE conversation_id = ? AND sender_id != ?',
      [true, conversationId, exceptSenderId]
    );
  }

  // Eliminar mensaje
  static async delete(id) {
    await query('DELETE FROM messages WHERE id = ?', [id]);
    return true;
  }

  // Formatear mensaje
  static formatMessage(message) {
    return {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      isRead: Boolean(message.is_read),
      createdAt: new Date(message.created_at).getTime()
    };
  }
}

module.exports = Message;
