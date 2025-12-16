//keel-mobile/src/db/watchkeeping.ts

/**
 * ============================================================
 * Watchkeeping — Local DB Adapter (SYNC, Expo SQLite)
 * ============================================================
 *
 * IMPORTANT:
 * This file follows the EXACT SAME PATTERN as database.ts
 * and daily logs DB usage.
 *
 * - Uses getDatabase()
 * - Uses execSync / getAllSync
 * - No transactions
 * - No async callbacks
 *
 * Do NOT refactor this file.
 */

import { getDatabase } from "./database";

/* ============================================================
 * Watchkeeping DB Row Shape
 * ============================================================ */

export type WatchEntryDB = {
  id: string;
  start_time: string;
  end_time: string;
  watch_type: string;
  ship_state: string;
  location: string;
  cargo_ops: number;
  cadet_discipline: string;
  remarks?: string | null;
  created_at: string;
};

/* ============================================================
 * Table Initialisation
 * ============================================================ */

export function initWatchkeepingTable(): void {
  const db = getDatabase();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS watchkeeping (
      id TEXT PRIMARY KEY NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      watch_type TEXT NOT NULL,
      ship_state TEXT NOT NULL,
      location TEXT NOT NULL,
      cargo_ops INTEGER NOT NULL,
      cadet_discipline TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

/* ============================================================
 * Fetch
 * ============================================================ */

export function getAllWatches(): WatchEntryDB[] {
  const db = getDatabase();

  return db.getAllSync<WatchEntryDB>(
    `SELECT * FROM watchkeeping ORDER BY start_time DESC;`
  );
}

/* ============================================================
 * Insert
 * ============================================================ */

export function insertWatch(entry: WatchEntryDB): void {
  const db = getDatabase();

db.execSync(`
  INSERT INTO watchkeeping (
    id,
    start_time,
    end_time,
    watch_type,
    ship_state,
    location,
    cargo_ops,
    cadet_discipline,
    remarks,
    created_at
  ) VALUES (
    '${entry.id}',
    '${entry.start_time}',
    '${entry.end_time}',
    '${entry.watch_type}',
    '${entry.ship_state}',
    '${entry.location}',
    ${entry.cargo_ops},
    '${entry.cadet_discipline}',
    ${entry.remarks ? `'${entry.remarks}'` : "NULL"},
    '${entry.created_at}'
  );
`);

}

/* ============================================================
 * Update
 * ============================================================ */

export function updateWatch(
  id: string,
  updates: Partial<WatchEntryDB>
): void {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  if (fields.length === 0) return;

    db.execSync(`
    UPDATE watchkeeping
    SET ${fields
        .map((f, i) => `${f.split(" = ")[0]} = '${values[i]}'`)
        .join(", ")}
    WHERE id = '${id}';
    `);

}

/* ============================================================
 * Delete
 * ============================================================ */

export function deleteWatchById(id: string): void {
  const db = getDatabase();

db.execSync(`
  DELETE FROM watchkeeping
  WHERE id = '${id}';
`);

}
