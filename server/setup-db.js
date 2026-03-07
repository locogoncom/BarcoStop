const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  let conn = null;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'admin'
    });

    await conn.query('DROP DATABASE IF EXISTS locogon_db0');
    await conn.query('CREATE DATABASE locogon_db0');

    // Reconnect to the new database
    await conn.end();
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'admin',
      database: 'locogon_db0'
    });

    const sql = fs.readFileSync('./database/init.sql', 'utf8');
    // Remove the USE statement  
    let cleanSql = sql.replace(/USE locogon_db0;/g, '');
    
    // Split statements - handle multiline statements
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

    let count = 0;
    for (const stmt of statementArray) {
      if (stmt && stmt !== 'USE locogon_db0;') {
        try {
          await conn.query(stmt);
          count++;
        } catch (err) {
          // Ignore duplicate table errors
          if (!err.message.includes('already exists')) {
            console.log('⚠️ Statement skipped due to:', err.code);
          }
        }
      }
    }

    const [rows] = await conn.execute('SELECT COUNT(*) as n FROM boats');
    console.log('✅ Database initialized successfully');
    console.log('✅ Boats table rows:', rows[0]?.n || 0);
    await conn.end();
  } catch (e) {
    console.error('❌ Database setup failed:', e.message);
    if (conn) await conn.end();
    process.exit(1);
  }
})();
