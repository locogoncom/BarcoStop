const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones
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
  connectionLimit: 10,
  queueLimit: 0,
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

module.exports = {
  pool,
  query,
  queryOne,
  testConnection
};
