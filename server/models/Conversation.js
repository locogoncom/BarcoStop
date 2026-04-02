const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Conversation {
  // Crear una nueva conversación
  static async create(conversationData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO conversations (id, trip_id)
      VALUES (?, ?)
    `;
    const params = [id, conversationData.tripId || null];
    
    await query(sql, params);
    
    // Agregar participantes
    if (conversationData.participants && conversationData.participants.length > 0) {
      await this.addParticipants(id, conversationData.participants);
    }
    
    return this.findById(id);
  }

  // Buscar conversación por ID
  static async findById(id) {
    const conversation = await queryOne('SELECT * FROM conversations WHERE id = ?', [id]);
    if (!conversation) return null;
    
    const formatted = this.formatConversation(conversation);
    formatted.participants = await this.getParticipants(id);
    
    return formatted;
  }

  // Buscar o crear conversación entre usuarios
  static async findOrCreateByParticipants(participantIds, tripId = null) {
    // Buscar conversación existente
    const sql = `
      SELECT c.id, COUNT(*) as participant_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id IN (${participantIds.map(() => '?').join(',')})
      GROUP BY c.id
      HAVING participant_count = ?
    `;
    
    const params = [...participantIds, participantIds.length];
    const result = await queryOne(sql, params);
    
    if (result) {
      return this.findById(result.id);
    }
    
    // Crear nueva conversación
    return this.create({
      participants: participantIds,
      tripId
    });
  }

  // Obtener conversaciones de un usuario
  static async findByUser(userId) {
    const sql = `
      SELECT DISTINCT c.*
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `;
    
    const conversations = await query(sql, [userId]);
    
    for (let conv of conversations) {
      Object.assign(conv, this.formatConversation(conv));
      conv.participants = await this.getParticipants(conv.id);
      
      // Obtener último mensaje
      const lastMessage = await queryOne(
        `SELECT m.*, u.name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at DESC
         LIMIT 1`,
        [conv.id]
      );
      
      if (lastMessage) {
        conv.lastMessage = {
          content: lastMessage.content,
          senderId: lastMessage.sender_id,
          senderName: lastMessage.sender_name,
          createdAt: new Date(lastMessage.created_at).getTime()
        };
      }
    }
    
    return conversations;
  }

  // Agregar participantes
  static async addParticipants(conversationId, userIds) {
    const sql = 'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)';
    for (let userId of userIds) {
      await query(sql, [conversationId, userId]);
    }
  }

  // Obtener participantes
  static async getParticipants(conversationId) {
    const sql = `
      SELECT u.id, u.name, u.avatar
      FROM users u
      JOIN conversation_participants cp ON u.id = cp.user_id
      WHERE cp.conversation_id = ?
    `;
    
    return await query(sql, [conversationId]);
  }

  // Eliminar conversación
  static async delete(id) {
    await query('DELETE FROM conversations WHERE id = ?', [id]);
    return true;
  }

  // Formatear conversación
  static formatConversation(conversation) {
    return {
      id: conversation.id,
      tripId: conversation.trip_id,
      createdAt: new Date(conversation.created_at).getTime(),
      updatedAt: new Date(conversation.updated_at).getTime()
    };
  }
}

module.exports = Conversation;
