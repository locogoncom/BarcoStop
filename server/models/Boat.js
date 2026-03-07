const { query, queryOne } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class Boat {
  // Crear un nuevo barco
  static async create(boatData) {
    const id = uuidv4();
    const sql = `
      INSERT INTO boats (id, patron_id, name, type, capacity, length, 
                        year_built, fuel_type, license_number, safety_equipment, 
                        description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const safetyEquipmentJson = boatData.safetyEquipment 
      ? JSON.stringify(boatData.safetyEquipment) 
      : JSON.stringify([]);
    
    const params = [
      id,
      boatData.patronId,
      boatData.name,
      boatData.type,
      boatData.capacity || 1,
      boatData.length || null,
      boatData.yearBuilt || null,
      boatData.fuelType || null,
      boatData.licenseNumber || null,
      safetyEquipmentJson,
      boatData.description || '',
      'active'
    ];
    
    await query(sql, params);
    return this.findById(id);
  }

  // Buscar barco por ID
  static async findById(id) {
    const boat = await queryOne('SELECT * FROM boats WHERE id = ?', [id]);
    if (!boat) return null;
    return this.formatBoat(boat);
  }

  // Obtener todos los barcos de un patrón
  static async findByPatronId(patronId) {
    const boats = await query(
      'SELECT * FROM boats WHERE patron_id = ? ORDER BY created_at DESC', 
      [patronId]
    );
    return boats.map(boat => this.formatBoat(boat));
  }

  // Obtener todos los barcos
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM boats WHERE 1=1';
    const params = [];

    if (filters.patronId) {
      sql += ' AND patron_id = ?';
      params.push(filters.patronId);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    } else {
      // Por defecto solo barcos activos
      sql += ' AND status = ?';
      params.push('active');
    }

    if (filters.type) {
      sql += ' AND type LIKE ?';
      params.push(`%${filters.type}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const boats = await query(sql, params);
    return boats.map(boat => this.formatBoat(boat));
  }

  // Actualizar barco
  static async update(id, boatData) {
    const updates = [];
    const params = [];

    if (boatData.name !== undefined) {
      updates.push('name = ?');
      params.push(boatData.name);
    }
    if (boatData.type !== undefined) {
      updates.push('type = ?');
      params.push(boatData.type);
    }
    if (boatData.capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(boatData.capacity);
    }
    if (boatData.length !== undefined) {
      updates.push('length = ?');
      params.push(boatData.length);
    }
    if (boatData.yearBuilt !== undefined) {
      updates.push('year_built = ?');
      params.push(boatData.yearBuilt);
    }
    if (boatData.fuelType !== undefined) {
      updates.push('fuel_type = ?');
      params.push(boatData.fuelType);
    }
    if (boatData.licenseNumber !== undefined) {
      updates.push('license_number = ?');
      params.push(boatData.licenseNumber);
    }
    if (boatData.safetyEquipment !== undefined) {
      updates.push('safety_equipment = ?');
      params.push(JSON.stringify(boatData.safetyEquipment || []));
    }
    if (boatData.description !== undefined) {
      updates.push('description = ?');
      params.push(boatData.description);
    }
    if (boatData.status !== undefined) {
      updates.push('status = ?');
      params.push(boatData.status);
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE boats SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params);
    return this.findById(id);
  }

  // Eliminar barco
  static async delete(id) {
    const boat = await this.findById(id);
    if (!boat) return false;

    await query('DELETE FROM boats WHERE id = ?', [id]);
    return true;
  }

  // Formatear barco de snake_case a camelCase
  static formatBoat(boat) {
    let safetyEquipment = [];
    if (boat.safety_equipment) {
      try {
        safetyEquipment = typeof boat.safety_equipment === 'string' 
          ? JSON.parse(boat.safety_equipment)
          : boat.safety_equipment;
      } catch (e) {
        safetyEquipment = [];
      }
    }

    return {
      id: boat.id,
      patronId: boat.patron_id,
      name: boat.name,
      type: boat.type,
      capacity: boat.capacity,
      length: boat.length ? parseFloat(boat.length) : null,
      yearBuilt: boat.year_built,
      fuelType: boat.fuel_type,
      licenseNumber: boat.license_number,
      safetyEquipment: safetyEquipment,
      description: boat.description,
      status: boat.status,
      createdAt: boat.created_at ? new Date(boat.created_at).getTime() : Date.now(),
      updatedAt: boat.updated_at ? new Date(boat.updated_at).getTime() : Date.now()
    };
  }
}

module.exports = Boat;
