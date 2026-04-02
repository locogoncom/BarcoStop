const { query, queryOne, pool } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Reservation {
  // Crear una nueva reservación
  static async create(reservationData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO reservations (id, trip_id, user_id, seats, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      reservationData.tripId,
      reservationData.userId,
      reservationData.seats || 1,
      reservationData.status || 'pending',
      reservationData.paymentStatus || 'pending'
    ];
    
    await query(sql, params);
    return this.findById(id);
  }

  // Buscar reservación por ID
  static async findById(id) {
    const reservation = await queryOne('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!reservation) return null;
    return this.formatReservation(reservation);
  }

  // Obtener todas las reservaciones
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];
    
    if (filters.tripId) {
      sql += ' AND trip_id = ?';
      params.push(filters.tripId);
    }
    
    if (filters.userId) {
      sql += ' AND user_id = ?';
      params.push(filters.userId);
    }
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const reservations = await query(sql, params);
    return reservations.map(r => this.formatReservation(r));
  }

  // Actualizar reservación
  static async update(id, reservationData) {
    const fields = [];
    const params = [];
    
    if (reservationData.status !== undefined) {
      fields.push('status = ?');
      params.push(reservationData.status);
    }
    if (reservationData.paymentStatus !== undefined) {
      fields.push('payment_status = ?');
      params.push(reservationData.paymentStatus);
    }
    if (reservationData.seats !== undefined) {
      fields.push('seats = ?');
      params.push(reservationData.seats);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    const sql = `UPDATE reservations SET ${fields.join(', ')} WHERE id = ?`;
    
    await query(sql, params);
    return this.findById(id);
  }

  // Eliminar reservación
  static async delete(id) {
    await query('DELETE FROM reservations WHERE id = ?', [id]);
    return true;
  }

  // Buscar reservaciones por trip ID
  static async findByTripId(tripId) {
    const sql = `
      SELECT r.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.trip_id = ?
      ORDER BY r.created_at DESC
    `;
    const reservations = await query(sql, [tripId]);
    return reservations.map(r => ({
      ...this.formatReservation(r),
      userName: r.user_name,
      userEmail: r.user_email,
      userAvatar: r.user_avatar
    }));
  }

  // Buscar reservaciones por user ID
  static async findByUserId(userId) {
    const sql = `
      SELECT r.*, t.origin, t.destination, t.departure_date, t.cost, 
             u.name as patron_name, u.email as patron_email
      FROM reservations r
      LEFT JOIN trips t ON r.trip_id = t.id
      LEFT JOIN users u ON t.patron_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;
    const reservations = await query(sql, [userId]);
    return reservations.map(r => ({
      ...this.formatReservation(r),
      origin: r.origin,
      destination: r.destination,
      departureDate: r.departure_date,
      price: r.cost,
      patronName: r.patron_name,
      patronEmail: r.patron_email,
      trip_id: r.trip_id,
      user_id: r.user_id
    }));
  }

  // Verificar si ya existe una reservación
  static async checkExists(tripId, userId) {
    const result = await queryOne(
      'SELECT id FROM reservations WHERE trip_id = ? AND user_id = ? AND status IN ("pending", "confirmed")',
      [tripId, userId]
    );
    return !!result;
  }

  // Actualizar solo el estado
  static async updateStatus(id, status) {
    const sql = 'UPDATE reservations SET status = ? WHERE id = ?';
    const [result] = await pool.execute(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // Formatear reservación
  static formatReservation(reservation) {
    return {
      id: reservation.id,
      tripId: reservation.trip_id,
      userId: reservation.user_id,
      seats: reservation.seats,
      status: reservation.status,
      paymentStatus: reservation.payment_status,
      createdAt: new Date(reservation.created_at).getTime(),
      updatedAt: new Date(reservation.updated_at).getTime()
    };
  }
}

module.exports = Reservation;
