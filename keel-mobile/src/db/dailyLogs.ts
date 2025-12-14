//keel-mobile/src/db/dailyLogs.ts

import { getDatabase } from "./database";

/**
 * DailyLogDBInput
 * ---------------
 * This is the exact shape we save into SQLite.
 * IMPORTANT:
 * - Keys here must match the columns created in database.ts (initDatabase)
 * - If we forget a column here, it will NEVER be saved (your issue earlier)
 */
export type DailyLogDBInput = {
  id: string;
  date: string; // ISO date string
  type: "DAILY" | "BRIDGE" | "ENGINE";
  startTime?: string | null;
  endTime?: string | null;
  summary: string;
  remarks?: string | null;

  // Bridge navigation fields (nullable)
  latDeg?: number | null;
  latMin?: number | null;
  latDir?: "N" | "S" | null;

  lonDeg?: number | null;
  lonMin?: number | null;
  lonDir?: "E" | "W" | null;

  // Bridge watchkeeping fields (nullable)
  courseDeg?: number | null;
  speedKn?: number | null;
  weather?: string | null;
  steeringMinutes?: number | null;
  lookoutRole?: string | null;

  // Engine watch payload (nullable)
  // We store a JSON string here so we can expand engine UI later without DB schema changes.
  machineryMonitored?: string | null;
};

/**
 * insertDailyLog
 * -------------
 * Inserts a log entry into SQLite.
 * IMPORTANT:
 * - Column list and VALUES placeholders must match exactly.
 * - If you add a column in the DB schema, you must add it here too.
 */
export function insertDailyLog(log: DailyLogDBInput): void {
  const db = getDatabase();

  db.runSync(
    `
    INSERT INTO daily_logs (
      id,
      date,
      type,
      start_time,
      end_time,
      summary,
      remarks,
      created_at,

      lat_deg,
      lat_min,
      lat_dir,
      lon_deg,
      lon_min,
      lon_dir,

      course_deg,
      speed_kn,
      weather,
      steering_minutes,
      lookout_role,

      machinery_monitored
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?
    )
    `,
    [
      log.id,
      log.date,
      log.type,
      log.startTime ?? null,
      log.endTime ?? null,
      log.summary,
      log.remarks ?? null,
      new Date().toISOString(),

      log.latDeg ?? null,
      log.latMin ?? null,
      log.latDir ?? null,
      log.lonDeg ?? null,
      log.lonMin ?? null,
      log.lonDir ?? null,

      log.courseDeg ?? null,
      log.speedKn ?? null,
      log.weather ?? null,
      log.steeringMinutes ?? null,
      log.lookoutRole ?? null,

      log.machineryMonitored ?? null,
    ]
  );
}

/**
 * updateDailyLog
 * -------------
 * Updates an existing log entry in SQLite.
 */
export function updateDailyLog(log: DailyLogDBInput): void {
  const db = getDatabase();

  db.runSync(
    `
    UPDATE daily_logs
    SET
      date = ?,
      type = ?,
      start_time = ?,
      end_time = ?,
      summary = ?,
      remarks = ?,

      lat_deg = ?,
      lat_min = ?,
      lat_dir = ?,
      lon_deg = ?,
      lon_min = ?,
      lon_dir = ?,

      course_deg = ?,
      speed_kn = ?,
      weather = ?,
      steering_minutes = ?,
      lookout_role = ?,

      machinery_monitored = ?
    WHERE id = ?
    `,
    [
      log.date,
      log.type,
      log.startTime ?? null,
      log.endTime ?? null,
      log.summary,
      log.remarks ?? null,

      log.latDeg ?? null,
      log.latMin ?? null,
      log.latDir ?? null,
      log.lonDeg ?? null,
      log.lonMin ?? null,
      log.lonDir ?? null,

      log.courseDeg ?? null,
      log.speedKn ?? null,
      log.weather ?? null,
      log.steeringMinutes ?? null,
      log.lookoutRole ?? null,

      log.machineryMonitored ?? null,

      log.id,
    ]
  );
}

/**
 * deleteDailyLogById
 * -----------------
 * Deletes a log by ID.
 */
export function deleteDailyLogById(id: string): void {
  const db = getDatabase();

  db.runSync(
    `
    DELETE FROM daily_logs
    WHERE id = ?
    `,
    [id]
  );
}

/**
 * getAllDailyLogs
 * --------------
 * Returns all logs (latest first).
 * IMPORTANT:
 * - SELECT must include all columns we expect in the UI.
 * - Aliases must match the DBInput keys.
 */
export function getAllDailyLogs(): DailyLogDBInput[] {
  const db = getDatabase();

  const result = db.getAllSync<DailyLogDBInput>(
    `
    SELECT
      id,
      date,
      type,
      start_time as startTime,
      end_time as endTime,
      summary,
      remarks,

      lat_deg as latDeg,
      lat_min as latMin,
      lat_dir as latDir,
      lon_deg as lonDeg,
      lon_min as lonMin,
      lon_dir as lonDir,

      course_deg as courseDeg,
      speed_kn as speedKn,
      weather as weather,
      steering_minutes as steeringMinutes,
      lookout_role as lookoutRole,

      machinery_monitored as machineryMonitored
    FROM daily_logs
    ORDER BY date DESC, created_at DESC
    `
  );

  return result ?? [];
}
