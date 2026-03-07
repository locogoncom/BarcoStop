const { query, queryOne } = require('../database/db');

class Rating {
  // Crear una nueva calificación
  static async create(ratingData) {
    const sql = `
      INSERT INTO ratings (user_id, rated_by, rating, comment)
      VALUES (?, ?, ?, ?)
    `;
    const params = [
      ratingData.userId,
      ratingData.ratedBy,
      ratingData.rating,
      ratingData.comment || ''
    ];

    const result = await query(sql, params);
    return this.findById(result.insertId);
  }

  // Buscar calificación por ID
  static async findById(id) {
    const rating = await queryOne('SELECT * FROM ratings WHERE id = ?', [id]);
    if (!rating) return null;
    return this.formatRating(rating);
  }

  // Obtener todas las calificaciones de un usuario
  static async findByUserId(userId) {
    const ratings = await query(
      'SELECT * FROM ratings WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return ratings.map(r => this.formatRating(r));
  }

  // Obtener todas las calificaciones hechas por un usuario
  static async findByRatedBy(ratedBy) {
    const ratings = await query(
      'SELECT * FROM ratings WHERE rated_by = ? ORDER BY created_at DESC',
      [ratedBy]
    );
    return ratings.map(r => this.formatRating(r));
  }

  // Obtener promedio de calificaciones de un usuario
  static async getAverageRating(userId) {
    const result = await queryOne(
      'SELECT AVG(rating) as average, COUNT(*) as count FROM ratings WHERE user_id = ?',
      [userId]
    );
    return {
      averageRating: result?.average ? parseFloat(result.average).toFixed(2) : 0,
      reviewCount: result?.count || 0
    };
  }

  // Verificar si ya existe una calificación entre dos usuarios
  static async existsRating(userId, ratedBy) {
    const rating = await queryOne(
      'SELECT id FROM ratings WHERE user_id = ? AND rated_by = ? LIMIT 1',
      [userId, ratedBy]
    );
    return !!rating;
  }

  // Eliminar calificación (si es necesario)
  static async delete(id) {
    const rating = await this.findById(id);
    if (!rating) return false;

    await query('DELETE FROM ratings WHERE id = ?', [id]);
    return true;
  }

  // Formatear calificación de snake_case a camelCase
  static formatRating(rating) {
    return {
      id: String(rating.id),
      userId: rating.user_id,
      ratedBy: rating.rated_by,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.created_at ? new Date(rating.created_at).getTime() : Date.now(),
    };
  }
}

module.exports = Rating;
