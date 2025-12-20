//keel-mobile/src/db/database.ts
import * as SQLite from "expo-sqlite";

/**
 * ============================================================
 * KEEL Local Database (SQLite)
 * ============================================================
 *
 * DESIGN GUARANTEES:
 * - NO breaking changes to existing installs
 * - ONLY additive schema changes
 * - Draft-safe for all modules
 * - Offline-first
 * - Inspector-grade data integrity
 *
 * EXISTING TABLES (UNCHANGED):
 * - daily_logs
 * - watchkeeping
 *
 * NEW TABLES (THIS STEP):
 * - sea_service_records
 * - task_records
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
 * Adds columns if they do not exist (SAFE migration).
 * NEVER drops or alters existing columns.
 */
function ensureColumns(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columns: { name: string; type: string }[]
): void {
  const rows = database.getAllSync<{ name: string }>(
    `PRAGMA table_info(${tableName});`
  );

  const existing = new Set((rows ?? []).map((r) => r.name));

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
 * Creates schema for fresh installs + runs SAFE migrations.
 */
export function initDatabase(): void {
  const database = getDatabase();

  /* ==========================================================
   * DAILY LOGS (EXISTING — DO NOT MODIFY)
   * ========================================================== */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,

      port_watch_type TEXT,

      start_time TEXT,
      end_time TEXT,
      summary TEXT NOT NULL,
      remarks TEXT,

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
      daily_work_categories TEXT,

      machinery_monitored TEXT,
      created_at TEXT NOT NULL
    );
  `);

  ensureColumns(database, "daily_logs", [
    { name: "port_watch_type", type: "TEXT" },
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
    { name: "daily_work_categories", type: "TEXT" },
    { name: "machinery_monitored", type: "TEXT" },
  ]);

  /* ==========================================================
   * SEA SERVICE (NEW — OPTION A)
   * ========================================================== */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS sea_service_records (
      id TEXT PRIMARY KEY NOT NULL,

      -- Identifies the vessel / service period logically
      ship_name TEXT,
      imo_number TEXT,

      -- Entire Sea Service payload (JSON)
      payload_json TEXT NOT NULL,

      -- Draft lifecycle
      status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT | FINAL
      last_updated_at INTEGER,

      -- Future sync support
      remote_id TEXT,
      sync_state TEXT DEFAULT 'LOCAL_ONLY',

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  /* ==========================================================
   * TASKS (NEW — OPTION A)
   * ========================================================== */
  database.execSync(`
    CREATE TABLE IF NOT EXISTS task_records (
      id TEXT PRIMARY KEY NOT NULL,

      task_key TEXT NOT NULL,        -- stable identifier from task catalog
      task_title TEXT NOT NULL,

      -- Task completion state
      status TEXT NOT NULL,          -- NOT_STARTED | IN_PROGRESS | COMPLETED
      remarks TEXT,

      -- Sign-off metadata (future-proof)
      signed_by TEXT,
      signed_rank TEXT,
      signed_at TEXT,

      -- Draft + sync
      remote_id TEXT,
      sync_state TEXT DEFAULT 'LOCAL_ONLY',

      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
