//keel-mobile/src/db/database.ts
import * as SQLite from "expo-sqlite";

/**
 * ============================================================
 * KEEL Local Database (SQLite)
 * ============================================================
 *
 * IMPORTANT DESIGN NOTES:
 * - We use a single DB file: keel.db
 * - We keep migrations SAFE by adding missing columns (no drops)
 * - `daily_logs.type` is TEXT so new types (like "PORT") are allowed
 * - Port Watch needs a dedicated column to store its sub-type
 *   (CARGO / ANCHOR / GANGWAY / BUNKERING)
 */

/**
 * Singleton database instance
 */
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get (or create) the KEEL local database.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("keel.db");
  }
  return db;
}

/**
 * ============================================================
 * Migration Helper: ensureColumns
 * ============================================================
 * Adds columns if they do not exist (safe migration).
 * This avoids breaking existing installs.
 */
function ensureColumns(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columns: { name: string; type: string }[]
): void {
  // Read current table schema
  const rows = database.getAllSync<{ name: string }>(
    `PRAGMA table_info(${tableName});`
  );

  const existing = new Set((rows ?? []).map((r) => r.name));

  // Add only missing columns
  for (const col of columns) {
    if (existing.has(col.name)) continue;

    database.execSync(
      `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`
    );
  }
}

/**
 * ============================================================
 * initDatabase
 * ============================================================
 * Creates schema for fresh installs + runs safe migrations.
 */
export function initDatabase(): void {
  const database = getDatabase();

  // ------------------------------------------------------------
  // Fresh install schema
  // ------------------------------------------------------------
  database.execSync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,

      -- New for Port Watch (D3.2): stores CARGO/ANCHOR/GANGWAY/BUNKERING
      port_watch_type TEXT,

      start_time TEXT,
      end_time TEXT,
      summary TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,

      -- Bridge navigation fields
      lat_deg INTEGER,
      lat_min REAL,
      lat_dir TEXT,

      lon_deg INTEGER,
      lon_min REAL,
      lon_dir TEXT,

      -- Bridge watchkeeping fields
      course_deg REAL,
      speed_kn REAL,
      weather TEXT,
      steering_minutes INTEGER,
      is_lookout INTEGER,

      -- Engine fields
      machinery_monitored TEXT
    );
  `);

  // ------------------------------------------------------------
  // Safe migrations (existing installs)
  // ------------------------------------------------------------
  ensureColumns(database, "daily_logs", [
    // Port Watch support (D3.2): add column if missing
    { name: "port_watch_type", type: "TEXT" },

    // Existing migration set (kept intact)
    { name: "lat_deg", type: "INTEGER" },
    { name: "lat_min", type: "REAL" },
    { name: "lat_dir", type: "TEXT" },

    { name: "lon_deg", type: "INTEGER" },
    { name: "lon_min", type: "REAL" },
    { name: "lon_dir", type: "TEXT" },

    { name: "course_deg", type: "REAL" },
    { name: "speed_kn", type: "REAL" },
    { name: "weather", type: "TEXT" },
    { name: "steering_minutes", type: "INTEGER" },
    { name: "is_lookout", type: "INTEGER" },

    { name: "machinery_monitored", type: "TEXT" },
  ]);
}
