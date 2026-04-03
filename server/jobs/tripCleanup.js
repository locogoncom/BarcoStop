const HOURS_DEFAULT = 8;
const INTERVAL_MS_DEFAULT = 60 * 60 * 1000;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

async function cleanupExpiredTripsMysql(db, hours) {
  const intervalExpr = `INTERVAL ${hours} HOUR`;

  const expiredWhere = `
    status = 'active'
    AND updated_at < DATE_SUB(NOW(), ${intervalExpr})
    AND TIMESTAMP(CONCAT(departure_date, ' ', departure_time)) < DATE_SUB(NOW(), ${intervalExpr})
  `;

  await db.query(
    `
      UPDATE trips t
      SET t.status = 'completed'
      WHERE ${expiredWhere}
        AND EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.trip_id = t.id AND r.status <> 'cancelled'
          LIMIT 1
        )
    `,
    [],
  );

  await db.query(
    `
      DELETE FROM trips
      WHERE ${expiredWhere}
        AND NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.trip_id = trips.id AND r.status <> 'cancelled'
          LIMIT 1
        )
    `,
    [],
  );
}

async function cleanupExpiredTripsSqlite(db, hours) {
  const hoursLiteral = `-${hours} hours`;

  const expiredWhere = `
    status = 'active'
    AND datetime(updated_at) < datetime('now', ?)
    AND datetime(departure_date || ' ' || departure_time) < datetime('now', ?)
  `;

  db.run(
    `
      UPDATE trips
      SET status = 'completed'
      WHERE ${expiredWhere}
        AND EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.trip_id = trips.id AND r.status <> 'cancelled'
          LIMIT 1
        )
    `,
    [hoursLiteral, hoursLiteral],
  );

  db.run(
    `
      DELETE FROM trips
      WHERE ${expiredWhere}
        AND NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.trip_id = trips.id AND r.status <> 'cancelled'
          LIMIT 1
        )
    `,
    [hoursLiteral, hoursLiteral],
  );
}

async function runCleanup(dbModule, dbType, hours) {
  if (dbType === 'mysql') {
    await cleanupExpiredTripsMysql(dbModule, hours);
    return;
  }

  await cleanupExpiredTripsSqlite(dbModule, hours);
}

function startTripCleanup(dbModule, dbType, opts = {}) {
  const hours = toInt(opts.hours, HOURS_DEFAULT);
  const intervalMs = toInt(opts.intervalMs, INTERVAL_MS_DEFAULT);
  const safeDbType = String(dbType || 'sqlite').toLowerCase();

  const tick = async () => {
    try {
      await runCleanup(dbModule, safeDbType, hours);
    } catch (err) {
      console.error('[tripCleanup] failed:', err?.message || err);
    }
  };

  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { startTripCleanup };