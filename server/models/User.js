const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class User {
  // Crear un nuevo usuario
  static async create(userData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO users (id, name, email, password, role, avatar, bio, boat_name, boat_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      userData.name,
      userData.email,
      userData.password || 'default_password', // Temporal, implementar hash después
      userData.role,
      userData.avatar || null,
      userData.bio || null,
      userData.boatName || null,
      userData.boatType || null
    ];
    
    await query(sql, params);
    
    // Si hay skills, agregarlas
    if (userData.skills && userData.skills.length > 0) {
      await this.addSkills(id, userData.skills);
    }
    
    return this.findById(id);
  }

  // Buscar usuario por ID
  static async findById(id) {
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return null;
    
    // Convertir snake_case a camelCase
    const formattedUser = this.formatUser(user);
    
    // Obtener skills
    formattedUser.skills = await this.getSkills(id);
    
    // Obtener ratings
    formattedUser.ratings = await this.getRatings(id);
    
    return formattedUser;
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return null;
    
    const formattedUser = this.formatUser(user);
    formattedUser.skills = await this.getSkills(user.id);
    formattedUser.ratings = await this.getRatings(user.id);
    
    return formattedUser;
  }

  // Obtener todos los usuarios
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    
    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }
    
    const users = await query(sql, params);
    
    // Obtener skills y ratings para cada usuario
    for (let user of users) {
      Object.assign(user, this.formatUser(user));
      user.skills = await this.getSkills(user.id);
      user.ratings = await this.getRatings(user.id);
    }
    
    return users;
  }

  // Actualizar usuario
  static async update(id, userData) {
    const fields = [];
    const params = [];
    
    if (userData.name !== undefined) {
      fields.push('name = ?');
      params.push(userData.name);
    }
    if (userData.email !== undefined) {
      fields.push('email = ?');
      params.push(userData.email);
    }
    if (userData.role !== undefined) {
      fields.push('role = ?');
      params.push(userData.role);
    }
    if (userData.avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(userData.avatar);
    }
    if (userData.bio !== undefined) {
      fields.push('bio = ?');
      params.push(userData.bio);
    }
    if (userData.boatName !== undefined) {
      fields.push('boat_name = ?');
      params.push(userData.boatName);
    }
    if (userData.boatType !== undefined) {
      fields.push('boat_type = ?');
      params.push(userData.boatType);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await query(sql, params);
    
    // Actualizar skills si se proporcionan
    if (userData.skills !== undefined) {
      await this.updateSkills(id, userData.skills);
    }
    
    return this.findById(id);
  }

  // Eliminar usuario
  static async delete(id) {
    await query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }

  // Agregar skills a un usuario
  static async addSkills(userId, skills) {
    const sql = 'INSERT INTO user_skills (user_id, name, level) VALUES (?, ?, ?)';
    for (let skill of skills) {
      await query(sql, [userId, skill.name, skill.level]);
    }
  }

  // Actualizar skills de un usuario
  static async updateSkills(userId, skills) {
    await query('DELETE FROM user_skills WHERE user_id = ?', [userId]);
    if (skills && skills.length > 0) {
      await this.addSkills(userId, skills);
    }
  }

  // Obtener skills de un usuario
  static async getSkills(userId) {
    return await query(
      'SELECT name, level FROM user_skills WHERE user_id = ?',
      [userId]
    );
  }

  // Agregar rating a un usuario
  static async addRating(userId, ratingData) {
    const sql = `
      INSERT INTO ratings (user_id, rated_by, rating, comment)
      VALUES (?, ?, ?, ?)
    `;
    await query(sql, [
      userId,
      ratingData.ratedBy,
      ratingData.rating,
      ratingData.comment || null
    ]);
    
    // Actualizar average_rating
    await this.updateAverageRating(userId);
    
    return this.findById(userId);
  }

  // Actualizar promedio de rating
  static async updateAverageRating(userId) {
    const result = await queryOne(
      'SELECT AVG(rating) as avg_rating FROM ratings WHERE user_id = ?',
      [userId]
    );
    
    const avgRating = result.avg_rating || 0;
    
    await query(
      'UPDATE users SET average_rating = ? WHERE id = ?',
      [avgRating, userId]
    );
  }

  // Obtener ratings de un usuario
  static async getRatings(userId) {
    const ratings = await query(
      `SELECT r.*, u.name as rated_by_name 
       FROM ratings r
       JOIN users u ON r.rated_by = u.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
    
    return ratings.map(r => ({
      rating: r.rating,
      comment: r.comment,
      ratedBy: r.rated_by,
      ratedByName: r.rated_by_name,
      createdAt: new Date(r.created_at).getTime()
    }));
  }

  // Actualizar promedio de calificación
  static async updateAverageRating(userId, averageRating) {
    const sql = 'UPDATE users SET average_rating = ? WHERE id = ?';
    await query(sql, [averageRating, userId]);
  }

  // Formatear usuario de snake_case a camelCase
  static formatUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      boatName: user.boat_name,
      boatType: user.boat_type,
      averageRating: parseFloat(user.average_rating) || 0,
      createdAt: new Date(user.created_at).getTime(),
      updatedAt: new Date(user.updated_at).getTime()
    };
  }
}

module.exports = User;
