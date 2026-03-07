const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

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

    // Leer el archivo SQL
    const sql = fs.readFileSync('./database/init.sql', 'utf8');
    
    // Remover la línea USE database
    let cleanSql = sql.replace(/USE locogon_db0;/g, '');
    
    // Dividir en sentencias individuales
    const statementArray = [];
    let current = '';
    
    for (const line of cleanSql.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        current += ' ' + trimmed;
        if (trimmed.endsWith(';')) {
          statementArray.push(current.trim());
          current = '';
        }
      }
    }

    console.log(`📋 Ejecutando ${statementArray.length} sentencias SQL...`);
    
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
          } else if (stmt.toUpperCase().includes('INSERT INTO')) {
            console.log(`  ✓ Datos insertados`);
          }
        } catch (err) {
          if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            skipped++;
          } else if (err.code === 'ER_DUP_ENTRY') {
            // Ignorar duplicados en inserts
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
