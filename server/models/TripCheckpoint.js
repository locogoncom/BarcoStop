const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class TripCheckpoint {
  static async ensureTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS trip_checkpoints (
        id VARCHAR(36) PRIMARY KEY,
        trip_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        checkpoint_type ENUM('start', 'mid', 'arrival', 'event') NOT NULL,
        note VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_trip_id (trip_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await query(sql, []);
  }

  static format(row) {
    return {
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      checkpointType: row.checkpoint_type,
      note: row.note || '',
      createdAt: new Date(row.created_at).getTime(),
    };
  }

  static async create(data) {
    await this.ensureTable();

    const id = uuidv4();
    const sql = `
      INSERT INTO trip_checkpoints (id, trip_id, user_id, checkpoint_type, note)
      VALUES (?, ?, ?, ?, ?)
    `;

    await query(sql, [
      id,
      data.tripId,
      data.userId,
      data.checkpointType,
      data.note || null,
    ]);

    return this.findById(id);
  }

  static async findById(id) {
    await this.ensureTable();
    const row = await queryOne('SELECT * FROM trip_checkpoints WHERE id = ?', [id]);
    if (!row) return null;
    return this.format(row);
  }

  static async findByTripId(tripId, limit = 100) {
    await this.ensureTable();
    const rows = await query(
      'SELECT * FROM trip_checkpoints WHERE trip_id = ? ORDER BY created_at DESC LIMIT ?',
      [tripId, limit]
    );
    return rows.map(r => this.format(r));
  }
}

module.exports = TripCheckpoint;
