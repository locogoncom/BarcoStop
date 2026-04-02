const { query, queryOne, pool } = require('../database');

class Favorite {
  // Agregar usuario a favoritos
  static async add(userId, favoriteUserId) {
    const result = await query(
      'INSERT INTO favorites (user_id, favorite_user_id) VALUES (?, ?)',
      [userId, favoriteUserId]
    );
    return result.insertId;
  }

  // Obtener todos los favoritos de un usuario
  static async findByUserId(userId) {
    const rows = await query(
      `SELECT 
        f.id,
        f.favorite_user_id as favoriteUserId,
        f.created_at as createdAt,
        u.id,
        u.name,
        u.email,
        u.role,
        u.bio,
        u.average_rating as averageRating,
        u.boat_name as boatName,
        u.boat_type as boatType
      FROM favorites f
      INNER JOIN users u ON f.favorite_user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  // Verificar si un usuario está en favoritos
  static async exists(userId, favoriteUserId) {
    const rows = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND favorite_user_id = ?',
      [userId, favoriteUserId]
    );
    return rows.length > 0;
  }

  // Eliminar de favoritos
  static async remove(userId, favoriteUserId) {
    const [result] = await pool.execute(
      'DELETE FROM favorites WHERE user_id = ? AND favorite_user_id = ?',
      [userId, favoriteUserId]
    );
    return result.affectedRows > 0;
  }

  // Obtener cantidad de favoritos de un usuario
  static async getCount(userId) {
    const rows = await query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = Favorite;
