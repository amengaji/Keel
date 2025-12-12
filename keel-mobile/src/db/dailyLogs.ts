//keel-mobile/src/db/dailyLogs.ts

import { getDatabase } from "./database";

/**
 * Shape used when saving/updating a daily log
 */
export type DailyLogDBInput = {
  id: string;
  date: string;         // ISO date string
  type: "DAILY" | "BRIDGE" | "ENGINE";
  startTime?: string;   // ISO time string
  endTime?: string;     // ISO time string
  summary: string;
  remarks?: string;
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
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
      remarks = ?
    WHERE id = ?
    `,
    [
      log.date,
      log.type,
      log.startTime ?? null,
      log.endTime ?? null,
      log.summary,
      log.remarks ?? null,
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
      remarks
    FROM daily_logs
    ORDER BY date DESC, created_at DESC
    `
  );

  return result ?? [];
}
