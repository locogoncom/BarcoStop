const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const placeholderValues = new Set([
  'tu valor',
  'your value',
  'your_value',
  'your-database-host.de',
  'your_user',
  'your_password',
  'your_database',
  'changeme',
  'change_me',
  'placeholder',
]);

const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const mysqlConnectionLimit = Number.parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10);
const mysqlQueueLimit = Number.parseInt(process.env.DB_QUEUE_LIMIT || '0', 10);

const getMysqlConfigIssues = (config) => {
  const requiredEntries = [
    ['DB_HOST', config.host],
    ['DB_USER', config.user],
    ['DB_PASSWORD', config.password],
    ['DB_NAME', config.database],
  ];

  return requiredEntries.flatMap(([key, value]) => {
    const normalizedValue = String(value || '').trim().toLowerCase();
    if (!normalizedValue) {
      return `${key} no está definida`;
    }
    if (placeholderValues.has(normalizedValue)) {
      return `${key} sigue con un placeholder`;
    }
    return [];
  });
};

const mysqlConfigIssues = getMysqlConfigIssues(mysqlConfig);

if (mysqlConfigIssues.length > 0) {
  throw new Error(
    `Configuración MySQL inválida: ${mysqlConfigIssues.join(', ')}. Corrige las variables en Render antes de desplegar.`
  );
}

// Configuración del pool de conexiones
const pool = mysql.createPool({
  host: mysqlConfig.host,
  port: mysqlConfig.port,
  user: mysqlConfig.user,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  waitForConnections: true,
  connectionLimit: Number.isFinite(mysqlConnectionLimit) && mysqlConnectionLimit > 0 ? mysqlConnectionLimit : 20,
  queueLimit: Number.isFinite(mysqlQueueLimit) && mysqlQueueLimit >= 0 ? mysqlQueueLimit : 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Prueba de conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ MySQL connection error:', error.message);
    return false;
  }
};

// Helper para ejecutar queries
const query = async (sql, params) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Helper para obtener una sola fila
const queryOne = async (sql, params) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const createTables = async () => {
  const statements = [
    `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('patron', 'viajero') NOT NULL,
      avatar VARCHAR(500),
      bio TEXT,
      boat_name VARCHAR(255),
      boat_type VARCHAR(255),
      average_rating DECIMAL(3,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS user_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      level ENUM('principiante', 'intermedio', 'experto') NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      rated_by VARCHAR(36) NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (rated_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_rated_by (rated_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      favorite_user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (favorite_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_favorite (user_id, favorite_user_id),
      INDEX idx_user_id (user_id),
      INDEX idx_favorite_user_id (favorite_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS trips (
      id VARCHAR(36) PRIMARY KEY,
      patron_id VARCHAR(36) NOT NULL,
      origin VARCHAR(255) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      departure_date DATE NOT NULL,
      departure_time TIME NOT NULL,
      estimated_duration VARCHAR(50),
      description TEXT,
      available_seats INT NOT NULL,
      cost DECIMAL(10,2) NOT NULL,
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patron_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_patron_id (patron_id),
      INDEX idx_departure_date (departure_date),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS trip_required_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trip_id VARCHAR(36) NOT NULL,
      name VARCHAR(100) NOT NULL,
      level ENUM('principiante', 'intermedio', 'experto') NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      INDEX idx_trip_id (trip_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS reservations (
      id VARCHAR(36) PRIMARY KEY,
      trip_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      seats INT NOT NULL DEFAULT 1,
      status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
      payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_trip_id (trip_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) PRIMARY KEY,
      trip_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
      INDEX idx_trip_id (trip_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_participant (conversation_id, user_id),
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS regatta_chats (
      trip_id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      UNIQUE KEY unique_regatta_chat_conversation (conversation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_sender_id (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS trip_tracking (
      id VARCHAR(36) PRIMARY KEY,
      trip_id VARCHAR(36) NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      speed DECIMAL(5,2),
      heading INT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      INDEX idx_trip_id (trip_id),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
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
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS boats (
      id VARCHAR(36) PRIMARY KEY,
      patron_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      capacity INT NOT NULL,
      length DECIMAL(5,2),
      year_built INT,
      fuel_type VARCHAR(50),
      license_number VARCHAR(100) UNIQUE,
      safety_equipment JSON,
      description TEXT,
      status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patron_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_patron_id (patron_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS donations (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'EUR',
      paypal_transaction_id VARCHAR(255),
      status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS support_messages (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      message TEXT NOT NULL,
      admin_reply TEXT,
      status ENUM('open', 'answered', 'closed') DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      replied_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_support_user_id (user_id),
      INDEX idx_support_status (status),
      INDEX idx_support_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS user_blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      blocker_id VARCHAR(36) NOT NULL,
      blocked_user_id VARCHAR(36) NOT NULL,
      reason VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_block_pair (blocker_id, blocked_user_id),
      INDEX idx_blocker_id (blocker_id),
      INDEX idx_blocked_user_id (blocked_user_id),
      INDEX idx_user_block_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS user_reports (
      id VARCHAR(36) PRIMARY KEY,
      reporter_id VARCHAR(36) NOT NULL,
      reported_user_id VARCHAR(36) NOT NULL,
      conversation_id VARCHAR(36),
      message_id VARCHAR(36),
      reason VARCHAR(120) NOT NULL,
      details TEXT,
      status ENUM('open', 'reviewing', 'resolved', 'dismissed') DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
      INDEX idx_reporter_id (reporter_id),
      INDEX idx_reported_user_id (reported_user_id),
      INDEX idx_report_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  ];

  for (const sql of statements) {
    await query(sql, []);
  }

  console.log('✓ MySQL full schema ensured');
};

module.exports = {
  pool,
  query,
  queryOne,
  testConnection,
  createTables
};
