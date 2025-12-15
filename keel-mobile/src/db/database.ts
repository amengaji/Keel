//keel-mobile/src/db/database.ts
import * as SQLite from "expo-sqlite";

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
 * ensureColumns
 * -------------
 * Safe schema migration helper.
 * Adds missing columns ONLY.
 */
function ensureColumns(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columns: Array<{ name: string; type: string }>
): void {
  const existing = database.getAllSync<{ name: string }>(
    `PRAGMA table_info(${tableName});`
  );

  const existingNames = new Set(
    (existing ?? []).map((c) => String(c.name))
  );

  for (const col of columns) {
    if (existingNames.has(col.name)) continue;

    database.execSync(
      `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`
    );
  }
}

/**
 * initDatabase
 * ------------
 * Initializes and migrates DB safely.
 */
export function initDatabase(): void {
  const database = getDatabase();

  // Fresh install schema
  database.execSync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      summary TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,

      -- Bridge fields
      lat_deg INTEGER,
      lat_min REAL,
      lat_dir TEXT,
      lon_deg INTEGER,
      lon_min REAL,
      lon_dir TEXT,
      course_deg REAL,
      speed_kn REAL,
      weather TEXT,
      steering_minutes INTEGER,
      is_lookout INTEGER,

      -- Engine fields
      machinery_monitored TEXT
    );
  `);

  // Safe migration for existing installs
  ensureColumns(database, "daily_logs", [
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
