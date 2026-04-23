const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await c.query("SHOW TABLES LIKE 'kp_%'");
  console.log('kp tables:', rows.map(r => Object.values(r)[0]).join(', '));
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
