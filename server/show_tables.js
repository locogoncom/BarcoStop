const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'locogon_db0'
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('❌ No hay tablas en la base de datos.');
      console.log('Ejecutá: node setup_database.js');
      process.exit(1);
    }
    
    console.log('\n✅ Tablas existentes en locogon_db0:\n');
    tables.forEach(row => console.log('  ✓', Object.values(row)[0]));
    
    console.log('\n📊 Total:', tables.length, 'tablas\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

showTables();
