const mysql = require('mysql2/promise');
require('dotenv').config();

const migrate = async () => {
  let connection;
  try {
    console.log('🚀 Iniciando migración de base de datos a UUID...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Conexión establecida con:', process.env.DB_HOST);

    // 1. Desactivar checks de llaves foráneas
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('⚙️ Foreign key checks desactivados.');

    // 2. Limpiar datos conflictivos
    console.log('🧹 Borrando viajes con IDs antiguos (numéricos)...');
    await connection.query('DELETE FROM trips WHERE LENGTH(id) < 30');

    // 3. Modificar la columna ID de la tabla trips
    console.log('🔧 Modificando trips.id a VARCHAR(36)...');
    await connection.query('ALTER TABLE trips MODIFY COLUMN id VARCHAR(36) NOT NULL');

    // 4. Modificar tablas relacionadas
    const relatedTables = [
      { name: 'reservations', column: 'trip_id' },
      { name: 'trip_checkpoints', column: 'trip_id' },
      { name: 'trip_tracking', column: 'trip_id' },
      { name: 'trip_required_skills', column: 'trip_id' },
      { name: 'conversations', column: 'trip_id' },
      { name: 'regatta_chats', column: 'trip_id' }
    ];

    for (const table of relatedTables) {
      console.log(`🔧 Modificando ${table.name}.${table.column} a VARCHAR(36)...`);
      try {
        await connection.query(`ALTER TABLE ${table.name} MODIFY COLUMN ${table.column} VARCHAR(36)`);
      } catch (err) {
        console.warn(`   ⚠️ No se pudo modificar ${table.name}: ${err.message}`);
      }
    }

    // 5. Reactivar checks de llaves foráneas
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('⚙️ Foreign key checks reactivados.');

    console.log('\n✨ ¡Migración completada con éxito!');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
};

migrate();
