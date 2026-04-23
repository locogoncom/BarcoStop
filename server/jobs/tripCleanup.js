const HOURS_DEFAULT = 8;
const INTERVAL_MS_DEFAULT = 60 * 60 * 1000; // 1h

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

async function cleanupExpiredTripsMysql(db, hours) {
  // "Expired" = departure datetime older than N hours AND row not updated in N hours.
  // Safety: if trip has any reservation not cancelled, we keep it and mark as completed.

  const intervalExpr = `INTERVAL ${hours} HOUR`;

  const expiredWhere = `
    status = 'active'
    AND updated_at < DATE_SUB(NOW(), ${intervalExpr})
    AND TIMESTAMP(CONCAT(departure_date, ' ', departure_time)) < DATE_SUB(NOW(), ${intervalExpr})
  `;

  // Mark completed when there is non-cancelled activity.
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

  // Delete truly inactive trips with no reservations (or only cancelled).
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

  // Mark completed when there is non-cancelled activity.
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

  // Delete truly inactive trips with no reservations (or only cancelled).
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
  // sqlite module exports run/query; we need .run for mutations.
  await cleanupExpiredTripsSqlite(dbModule, hours);
}

function startTripCleanup(dbModule, dbType, opts = {}) {
  const hours = toInt(opts.hours, HOURS_DEFAULT);
  const intervalMs = toInt(opts.intervalMs, INTERVAL_MS_DEFAULT);

  const safeDbType = String(dbType || 'sqlite').toLowerCase();

  const tick = async () => {
    try {
      await runCleanup(dbModule, safeDbType, hours);
      // keep it quiet; server already logs requests/errors.
    } catch (err) {
      console.error('[tripCleanup] failed:', err?.message || err);
    }
  };

  // Run once on startup, then on interval.
  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { startTripCleanup };

