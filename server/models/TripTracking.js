const { query, queryOne } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class TripTracking {
  // Crear un nuevo punto de seguimiento
  static async create(trackingData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO trip_tracking (id, trip_id, latitude, longitude, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      trackingData.tripId,
      trackingData.latitude,
      trackingData.longitude,
      trackingData.speed || null,
      trackingData.heading || null
    ];
    
    await query(sql, params);
    return this.findById(id);
  }

  // Buscar tracking por ID
  static async findById(id) {
    const tracking = await queryOne('SELECT * FROM trip_tracking WHERE id = ?', [id]);
    if (!tracking) return null;
    return this.formatTracking(tracking);
  }

  // Obtener histórico de tracking de un viaje
  static async findByTrip(tripId, limit = 100) {
    const sql = `
      SELECT * FROM trip_tracking
      WHERE trip_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    
    const trackings = await query(sql, [tripId, limit]);
    return trackings.map(t => this.formatTracking(t));
  }

  // Obtener última posición de un viaje
  static async getLastPosition(tripId) {
    const sql = `
      SELECT * FROM trip_tracking
      WHERE trip_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    const tracking = await queryOne(sql, [tripId]);
    if (!tracking) return null;
    return this.formatTracking(tracking);
  }

  // Eliminar tracking
  static async delete(id) {
    await query('DELETE FROM trip_tracking WHERE id = ?', [id]);
    return true;
  }

  // Eliminar todo el tracking de un viaje
  static async deleteByTrip(tripId) {
    await query('DELETE FROM trip_tracking WHERE trip_id = ?', [tripId]);
    return true;
  }

  // Formatear tracking
  static formatTracking(tracking) {
    return {
      id: tracking.id,
      tripId: tracking.trip_id,
      latitude: parseFloat(tracking.latitude),
      longitude: parseFloat(tracking.longitude),
      speed: tracking.speed ? parseFloat(tracking.speed) : null,
      heading: tracking.heading,
      timestamp: new Date(tracking.timestamp).getTime()
    };
  }
}

module.exports = TripTracking;
