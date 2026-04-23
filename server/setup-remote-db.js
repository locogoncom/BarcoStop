const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function extractStatements(sql) {
  return sql
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'))
    .join('\n')
    .split(';')
    .map((stmt) => stmt.trim())
    .filter(Boolean);
}

(async () => {
  let conn = null;
  try {
    // Conectar a la base de datos remota
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Conectado a base de datos remota:', process.env.DB_HOST);

    const initSqlPath = path.join(__dirname, 'database', 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8').replace(/USE\s+locogon_db0;/gi, '');

    const statementArray = [
      ...extractStatements(initSql),
    ];

    console.log(`📋 Ejecutando ${statementArray.length} sentencias SQL del core de BarcoStop...`);
    
    let created = 0;
    let skipped = 0;
    
    for (const stmt of statementArray) {
      if (stmt) {
        try {
          await conn.query(stmt);
          if (stmt.toUpperCase().includes('CREATE TABLE')) {
            const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)?.[1];
            console.log(`  ✓ Tabla creada: ${tableName}`);
            created++;
          } else if (stmt.toUpperCase().includes('INSERT INTO') || stmt.toUpperCase().includes('INSERT IGNORE INTO')) {
            console.log(`  ✓ Datos insertados`);
          }
        } catch (err) {
          if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            skipped++;
          } else if (err.code === 'ER_DUP_ENTRY') {
            // Ignorar duplicados en inserts
          } else if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_MULTIPLE_PRI_KEY') {
            // Idempotencia para ALTER TABLE en servidores con esquema previo.
          } else {
            console.error(`  ⚠️  Error: ${err.code} - ${err.message.substring(0, 80)}`);
          }
        }
      }
    }

    // Verificar tablas creadas
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`\n✅ Base de datos configurada exitosamente`);
    console.log(`📊 Total de tablas: ${tables.length}`);
    console.log(`📝 Tablas creadas: ${created}, saltadas: ${skipped}`);
    
    // Mostrar lista de tablas
    console.log('\n📋 Tablas disponibles:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`   - ${tableName}`);
    });

    await conn.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (conn) await conn.end();
    process.exit(1);
  }
})();
