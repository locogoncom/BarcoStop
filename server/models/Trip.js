const { query, queryOne } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Trip {
  // Crear un nuevo viaje
  static async create(tripData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO trips (id, patron_id, origin, destination, departure_date, 
                        departure_time, estimated_duration, description, 
                        available_seats, cost, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      tripData.patronId,
      tripData.route.origin,
      tripData.route.destination,
      tripData.route.departureDate,
      tripData.route.departureTime,
      tripData.route.estimatedDuration || null,
      tripData.description || '',
      tripData.availableSeats || 1,
      tripData.cost || 0,
      'active'
    ];
    
    await query(sql, params);
    
    // Si hay requiredSkills, agregarlas
    if (tripData.requiredSkills && tripData.requiredSkills.length > 0) {
      await this.addRequiredSkills(id, tripData.requiredSkills);
    }
    
    return this.findById(id);
  }

  // Buscar viaje por ID
  static async findById(id) {
    const trip = await queryOne('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) return null;
    
    const formattedTrip = this.formatTrip(trip);
    formattedTrip.requiredSkills = await this.getRequiredSkills(id);
    
    // Obtener información del patrón
    const patron = await query(
      'SELECT id, name, boat_name, boat_type, average_rating FROM users WHERE id = ?',
      [trip.patron_id]
    );
    if (patron[0]) {
      formattedTrip.patron = {
        id: patron[0].id,
        name: patron[0].name,
        boatName: patron[0].boat_name,
        boatType: patron[0].boat_type,
        averageRating: parseFloat(patron[0].average_rating) || 0
      };
    }
    
    return formattedTrip;
  }

  // Obtener todos los viajes
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM trips WHERE 1=1';
    const params = [];
    
    if (filters.patronId) {
      sql += ' AND patron_id = ?';
      params.push(filters.patronId);
    }
    
    if (filters.origin) {
      sql += ' AND origin LIKE ?';
      params.push(`%${filters.origin}%`);
    }
    
    if (filters.destination) {
      sql += ' AND destination LIKE ?';
      params.push(`%${filters.destination}%`);
    }
    
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    } else {
      // Por defecto solo viajes activos
      sql += ' AND status = ?';
      params.push('active');
    }
    
    if (filters.departureDate) {
      sql += ' AND departure_date >= ?';
      params.push(filters.departureDate);
    }
    
    sql += ' ORDER BY departure_date ASC, departure_time ASC';
    
    const trips = await query(sql, params);
    
    // Formatear cada viaje
    const formattedTrips = [];
    for (let trip of trips) {
      const formatted = this.formatTrip(trip);
      formatted.requiredSkills = await this.getRequiredSkills(trip.id);
      
      // Obtener información del patrón
      const patron = await queryOne(
        'SELECT id, name, boat_name, boat_type, average_rating FROM users WHERE id = ?',
        [trip.patron_id]
      );
      if (patron) {
        formatted.patron = {
          id: patron.id,
          name: patron.name,
          boatName: patron.boat_name,
          boatType: patron.boat_type,
          averageRating: parseFloat(patron.average_rating) || 0
        };
      }
      formattedTrips.push(formatted);
    }
    
    return formattedTrips;
  }

  // Actualizar viaje
  static async update(id, tripData) {
    const fields = [];
    const params = [];
    
    if (tripData.route) {
      if (tripData.route.origin !== undefined) {
        fields.push('origin = ?');
        params.push(tripData.route.origin);
      }
      if (tripData.route.destination !== undefined) {
        fields.push('destination = ?');
        params.push(tripData.route.destination);
      }
      if (tripData.route.departureDate !== undefined) {
        fields.push('departure_date = ?');
        params.push(tripData.route.departureDate);
      }
      if (tripData.route.departureTime !== undefined) {
        fields.push('departure_time = ?');
        params.push(tripData.route.departureTime);
      }
      if (tripData.route.estimatedDuration !== undefined) {
        fields.push('estimated_duration = ?');
        params.push(tripData.route.estimatedDuration);
      }
    }
    
    if (tripData.description !== undefined) {
      fields.push('description = ?');
      params.push(tripData.description);
    }
    if (tripData.availableSeats !== undefined) {
      fields.push('available_seats = ?');
      params.push(tripData.availableSeats);
    }
    if (tripData.cost !== undefined) {
      fields.push('cost = ?');
      params.push(tripData.cost);
    }
    if (tripData.status !== undefined) {
      fields.push('status = ?');
      params.push(tripData.status);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    const sql = `UPDATE trips SET ${fields.join(', ')} WHERE id = ?`;
    
    await query(sql, params);
    
    // Actualizar requiredSkills si se proporcionan
    if (tripData.requiredSkills !== undefined) {
      await this.updateRequiredSkills(id, tripData.requiredSkills);
    }
    
    return this.findById(id);
  }

  // Eliminar viaje
  static async delete(id) {
    await query('DELETE FROM trips WHERE id = ?', [id]);
    return true;
  }

  // Agregar habilidades requeridas
  static async addRequiredSkills(tripId, skills) {
    const sql = 'INSERT INTO trip_required_skills (trip_id, name, level) VALUES (?, ?, ?)';
    for (let skill of skills) {
      await query(sql, [tripId, skill.name, skill.level]);
    }
  }

  // Actualizar habilidades requeridas
  static async updateRequiredSkills(tripId, skills) {
    await query('DELETE FROM trip_required_skills WHERE trip_id = ?', [tripId]);
    if (skills && skills.length > 0) {
      await this.addRequiredSkills(tripId, skills);
    }
  }

  // Obtener habilidades requeridas
  static async getRequiredSkills(tripId) {
    return await query(
      'SELECT name, level FROM trip_required_skills WHERE trip_id = ?',
      [tripId]
    );
  }

  // Formatear viaje de snake_case a camelCase y garantizar compatibilidad frontend
  static formatTrip(trip) {
    const origin = trip.origin;
    const destination = trip.destination;
    const departureDate = trip.departure_date;
    const departureTime = trip.departure_time;
    const estimatedDuration = trip.estimated_duration;
    // Garantizar que los campos estén en ambos niveles
    return {
      id: trip.id,
      patronId: trip.patron_id,
      origin,
      destination,
      departureDate,
      departureTime,
      estimatedDuration,
      // route anidado para compatibilidad
      route: {
        origin,
        destination,
        departureDate,
        departureTime,
        estimatedDuration
      },
      description: trip.description,
      availableSeats: trip.available_seats,
      cost: parseFloat(trip.cost) || 0,
      status: trip.status,
      createdAt: trip.created_at ? new Date(trip.created_at).getTime() : Date.now(),
      updatedAt: trip.updated_at ? new Date(trip.updated_at).getTime() : Date.now()
    };
  }
}

module.exports = Trip;
