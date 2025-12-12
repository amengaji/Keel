//keel-mobile/src/db/dailyLogs.ts

import { getDatabase } from "./database";

/**
 * Shape used when saving/updating a daily log
 */
export type DailyLogDBInput = {
  id: string;
  date: string; // ISO date string
  type: "DAILY" | "BRIDGE" | "ENGINE";
  startTime?: string;
  endTime?: string;
  summary: string;
  remarks?: string;

  // Bridge navigation fields (nullable)
  latDeg?: number | null;
  latMin?: number | null;
  latDir?: "N" | "S" | null;

  lonDeg?: number | null;
  lonMin?: number | null;
  lonDir?: "E" | "W" | null;

  // Bridge watchkeeping fields
  courseDeg?: number | null;
  speedKn?: number | null;
  weather?: string | null;
  steeringMinutes?: number | null;
  lookoutRole?: string | null;
  };

/**
 * Insert a daily log into SQLite
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
      lon_dir
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    ]
  );
}

/**
 * Update an existing daily log
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
      lon_dir = ?
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

      log.id,
    ]
  );
}

/**
 * Delete a daily log by ID
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
 * Fetch all daily logs from SQLite
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
      lon_dir as lonDir
    FROM daily_logs
    ORDER BY date DESC, created_at DESC
    `
  );

  return result ?? [];
}
