const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'locogon_db0',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf8');
    console.log('Ejecutando script SQL...');
    await connection.query(sql);
    console.log('✅ Tablas creadas exitosamente en la base de datos locogon_db0');
    
    // Verificar tablas creadas
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTablas en la base de datos:');
    tables.forEach(row => console.log('  -', Object.values(row)[0]));
    
  } catch (error) {
    console.error('❌ Error al crear tablas:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createTables();
