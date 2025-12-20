//keel-mobile/src/db/seaService.ts
import { getDatabase } from "./database";
import {
  DEFAULT_SEA_SERVICE_PAYLOAD,
  SeaServicePayload,
} from "../sea-service/seaServiceDefaults";

/**
 * ============================================================
 * Sea Service — Local DB Adapter (Option A)
 * ============================================================
 *
 * GOAL:
 * - Store ONE Sea Service record locally (offline-first)
 * - Draft-safe JSON storage (backward-compatible)
 * - Future sync-ready (remote_id + sync_state already in schema)
 *
 * IMPORTANT:
 * - NO UI changes here
 * - NO toast calls here (Contexts/Screens will handle toasts)
 * - Uses Expo SQLite SYNC API (openDatabaseSync / runSync / getAllSync)
 *
 * TABLE (already created in Step 2):
 * - sea_service_records
 */

/**
 * Option A strategy:
 * - Always store Sea Service under ONE stable local primary key.
 * - This avoids creating multiple records and matches your "single live record" requirement.
 *
 * If later you want per-vessel history, we can migrate safely to Option B.
 */
export const SEA_SERVICE_PRIMARY_ID = "SEA_SERVICE_PRIMARY_V1";

/**
 * Standardised sync states (future server sync)
 * Kept as string literals so we don't break DB values later.
 */
export type SyncState =
  | "LOCAL_ONLY"
  | "DIRTY"
  | "SYNCING"
  | "SYNCED"
  | "CONFLICT";

/**
 * Sea Service record as returned by DB adapter.
 * Payload is always returned as a usable object.
 */
export type SeaServiceRecord = {
  id: string;
  shipName: string | null;
  imoNumber: string | null;
  payload: SeaServicePayload;
  status: "DRAFT" | "FINAL";
  lastUpdatedAt: number | null;
  remoteId: string | null;
  syncState: SyncState;
  createdAt: string;
  updatedAt: string;
};

/**
 * ------------------------------------------------------------
 * Helper: safe JSON parse
 * ------------------------------------------------------------
 * If payload is corrupt, we fail safe by returning defaults.
 */
function safeParsePayload(payloadJson: string): SeaServicePayload {
  try {
    const parsed = JSON.parse(payloadJson);
    return parsed as SeaServicePayload;
  } catch {
    // Inspector-grade behavior: never crash, never return undefined.
    return DEFAULT_SEA_SERVICE_PAYLOAD;
  }
}

/**
 * ------------------------------------------------------------
 * Helper: derive ship identity fields from payload
 * ------------------------------------------------------------
 * We keep these duplicated as columns for future quick search/filtering.
 * (Payload remains the single source of truth.)
 */
function deriveShipIdentity(payload: SeaServicePayload): {
  shipName: string | null;
  imoNumber: string | null;
} {
  const general = payload?.sections?.GENERAL_IDENTITY ?? {};
  const shipName =
    typeof general.shipName === "string" && general.shipName.trim().length > 0
      ? general.shipName.trim()
      : null;

  const imoNumber =
    typeof general.imoNumber === "string" && general.imoNumber.trim().length > 0
      ? general.imoNumber.trim()
      : null;

  return { shipName, imoNumber };
}

/**
 * ============================================================
 * upsertSeaServiceDraft
 * ============================================================
 * Saves the current Sea Service payload (DRAFT).
 *
 * Draft-safe rules:
 * - Always overwrites SEA_SERVICE_PRIMARY_ID (Option A)
 * - Updates updated_at timestamp
 * - Updates last_updated_at (epoch ms)
 * - Marks sync_state = DIRTY (because local changes exist)
 */
export function upsertSeaServiceDraft(payload: SeaServicePayload): void {
  const db = getDatabase();

  const nowIso = new Date().toISOString();
  const lastUpdatedAt =
    typeof payload.lastUpdatedAt === "number" ? payload.lastUpdatedAt : Date.now();

  const { shipName, imoNumber } = deriveShipIdentity(payload);

  // Store updated timestamp into payload too (keeps UI state consistent later)
  const payloadToStore: SeaServicePayload = {
    ...payload,
    lastUpdatedAt,
  };

  const payloadJson = JSON.stringify(payloadToStore);

  // We implement "upsert" using: INSERT ... ON CONFLICT(id) DO UPDATE
  // This is safe and fast for a singleton record.
  db.runSync(
    `
    INSERT INTO sea_service_records (
      id,
      ship_name,
      imo_number,
      payload_json,
      status,
      last_updated_at,
      remote_id,
      sync_state,
      created_at,
      updated_at
    )
    VALUES (
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      ship_name = excluded.ship_name,
      imo_number = excluded.imo_number,
      payload_json = excluded.payload_json,
      status = excluded.status,
      last_updated_at = excluded.last_updated_at,
      -- remote_id should not be overwritten here (sync engine will control it)
      sync_state = excluded.sync_state,
      updated_at = excluded.updated_at
    `,
    [
      SEA_SERVICE_PRIMARY_ID,
      shipName,
      imoNumber,
      payloadJson,
      "DRAFT",
      lastUpdatedAt,
      null, // remote_id stays null for now
      "DIRTY",
      nowIso,
      nowIso,
    ]
  );
}

/**
 * ============================================================
 * finalizeSeaService
 * ============================================================
 * Locks the Sea Service record as FINAL.
 *
 * Notes:
 * - We do NOT delete drafts.
 * - We simply mark status FINAL.
 * - Sync state becomes DIRTY (needs upload later).
 */
export function finalizeSeaService(): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.runSync(
    `
    UPDATE sea_service_records
    SET
      status = 'FINAL',
      sync_state = 'DIRTY',
      updated_at = ?
    WHERE id = ?
    `,
    [nowIso, SEA_SERVICE_PRIMARY_ID]
  );
}

/**
 * ============================================================
 * getSeaServiceRecord
 * ============================================================
 * Loads the Sea Service record from DB.
 *
 * Returns:
 * - null if nothing saved yet
 * - otherwise a fully parsed SeaServiceRecord
 */
export function getSeaServiceRecord(): SeaServiceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT
      id,
      ship_name AS shipName,
      imo_number AS imoNumber,
      payload_json AS payloadJson,
      status,
      last_updated_at AS lastUpdatedAt,
      remote_id AS remoteId,
      sync_state AS syncState,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM sea_service_records
    WHERE id = ?
    LIMIT 1
    `,
    [SEA_SERVICE_PRIMARY_ID]
  );

  const row = rows?.[0];
  if (!row) return null;

  const payload = safeParsePayload(String(row.payloadJson ?? ""));

  return {
    id: String(row.id),
    shipName: row.shipName ?? null,
    imoNumber: row.imoNumber ?? null,
    payload,
    status: row.status === "FINAL" ? "FINAL" : "DRAFT",
    lastUpdatedAt:
      typeof row.lastUpdatedAt === "number" ? row.lastUpdatedAt : null,
    remoteId: row.remoteId ?? null,
    syncState: (row.syncState ?? "LOCAL_ONLY") as SyncState,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

/**
 * ============================================================
 * getSeaServicePayloadOrDefault
 * ============================================================
 * Convenience helper for Contexts:
 * - If record exists -> return payload
 * - Else -> return DEFAULT payload
 */
export function getSeaServicePayloadOrDefault(): SeaServicePayload {
  const record = getSeaServiceRecord();
  if (record?.payload) return record.payload;
  return DEFAULT_SEA_SERVICE_PAYLOAD;
}
