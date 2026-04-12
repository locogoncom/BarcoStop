const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class SupportMessage {
  static async create(payload) {
    const id = uuidv4();
    await query(
      `
        INSERT INTO support_messages (id, user_id, message, admin_reply, status, replied_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id, payload.userId, payload.message, payload.adminReply || null, payload.status || 'open', payload.repliedAt || null],
    );
    return this.findById(id);
  }

  static async findById(id) {
    const row = await queryOne('SELECT * FROM support_messages WHERE id = ?', [id]);
    return row ? this.format(row) : null;
  }

  static async findByUserId(userId) {
    const rows = await query('SELECT * FROM support_messages WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(row => this.format(row));
  }

  static async deleteByUser(id, userId) {
    const existing = await queryOne('SELECT id FROM support_messages WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) return false;
    await query('DELETE FROM support_messages WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  }

  static format(row) {
    const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : createdAt;
    const repliedAt = row.replied_at ? new Date(row.replied_at).getTime() : undefined;

    return {
      id: String(row.id),
      userId: String(row.user_id),
      message: String(row.message || ''),
      adminReply: typeof row.admin_reply === 'string' && row.admin_reply.trim() ? row.admin_reply : undefined,
      status: row.status === 'answered' || row.status === 'closed' ? row.status : 'open',
      createdAt,
      updatedAt,
      repliedAt,
    };
  }
}

module.exports = SupportMessage;