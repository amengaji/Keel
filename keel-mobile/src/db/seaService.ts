//keel-mobile/src/db/seaService.ts
import { getDatabase } from "./database";
import {
  DEFAULT_SEA_SERVICE_PAYLOAD,
  SeaServicePayload,
} from "../sea-service/seaServiceDefaults";

/**
 * ============================================================
 * Sea Service — Local DB Adapter (Option 3 Hybrid)
 * ============================================================
 *
 * GOAL (FINAL DECISION):
 * - Multiple Sea Service records (per vessel stay)
 * - Exactly ONE active record can be DRAFT at a time
 * - FINAL records are read-only at UI/domain layer
 *
 * IMPORTANT:
 * - NO UI changes here
 * - NO toast calls here (Screens/Contexts handle toasts)
 * - Dates are stored as ISO strings "YYYY-MM-DD" inside payload and in columns
 *
 * TABLE:
 * - sea_service_records
 *   - status: DRAFT | FINAL
 *   - DB enforces only one DRAFT via partial unique index
 */

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

  // Duplicated service period columns (ISO date strings "YYYY-MM-DD")
  signOnDate: string | null;
  signOffDate: string | null;

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
 * Helper: create a stable local id (offline-safe)
 * ------------------------------------------------------------
 * We avoid adding new dependencies here.
 * This id is only local until backend sync assigns remote_id.
 */
function createLocalId(): string {
  // Example: ss_1734860440123_k9f3xq
  return `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * ------------------------------------------------------------
 * Helper: derive ship identity fields from payload
 * ------------------------------------------------------------
 * We keep these duplicated as columns for dashboard listing and search.
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
 * ------------------------------------------------------------
 * Helper: derive sign-on/off ISO dates from payload.servicePeriod
 * ------------------------------------------------------------
 * IMPORTANT: We store dates as ISO strings "YYYY-MM-DD" (never Date objects).
 */
function deriveServicePeriodDates(payload: SeaServicePayload): {
  signOnDate: string | null;
  signOffDate: string | null;
} {
  // NOTE:
  // Your current SeaServicePayload types store dates as Date | null.
  // We must handle Date safely here and convert to ISO "YYYY-MM-DD" for DB columns.

  const period = payload?.servicePeriod ?? null;

  const toIsoDateOnly = (value: unknown): string | null => {
    if (!value) return null;

    // If already a string (e.g., migrated data), accept it if non-empty.
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    // If a Date object, convert to YYYY-MM-DD.
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    return null;
  };

  // Use unknown to avoid TS narrowing to never (because payload types are Date|null today)
  const rawSignOn: unknown = (period as any)?.signOnDate;
  const rawSignOff: unknown = (period as any)?.signOffDate;

  return {
    signOnDate: toIsoDateOnly(rawSignOn),
    signOffDate: toIsoDateOnly(rawSignOff),
  };
}


/**
 * ============================================================
 * createSeaServiceDraft
 * ============================================================
 * Creates a NEW Sea Service record in DRAFT state.
 *
 * Critical behavior:
 * - If a DRAFT already exists, DB unique index will reject insert.
 * - We surface that failure to caller (Context/Screen decides toast).
 */
export function createSeaServiceDraft(
  initialPayload?: SeaServicePayload
): { id: string } {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  const id = createLocalId();

  const payload: SeaServicePayload = {
    ...(initialPayload ?? DEFAULT_SEA_SERVICE_PAYLOAD),
    lastUpdatedAt: Date.now(),
  };

  const { shipName, imoNumber } = deriveShipIdentity(payload);
  const { signOnDate, signOffDate } = deriveServicePeriodDates(payload);

  db.runSync(
    `
    INSERT INTO sea_service_records (
      id,
      ship_name,
      imo_number,
      sign_on_date,
      sign_off_date,
      payload_json,
      status,
      last_updated_at,
      remote_id,
      sync_state,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?)
    `,
    [
      id,
      shipName,
      imoNumber,
      signOnDate,
      signOffDate,
      JSON.stringify(payload),
      payload.lastUpdatedAt ?? Date.now(),
      null, // remote_id stays null until sync
      "DIRTY",
      nowIso,
      nowIso,
    ]
  );

  return { id };
}

/**
 * ============================================================
 * upsertSeaServiceDraft
 * ============================================================
 * Saves the payload into the EXISTING DRAFT record (by id).
 *
 * Notes:
 * - We do not create drafts here (use createSeaServiceDraft first).
 * - This function is draft-safe and sync-ready.
 */
export function upsertSeaServiceDraft(
  recordId: string,
  payload: SeaServicePayload
): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  const lastUpdatedAt =
    typeof payload.lastUpdatedAt === "number" ? payload.lastUpdatedAt : Date.now();

  const payloadToStore: SeaServicePayload = {
    ...payload,
    lastUpdatedAt,
  };

  const { shipName, imoNumber } = deriveShipIdentity(payloadToStore);
  const { signOnDate, signOffDate } = deriveServicePeriodDates(payloadToStore);

  db.runSync(
    `
    UPDATE sea_service_records
    SET
      ship_name = ?,
      imo_number = ?,
      sign_on_date = ?,
      sign_off_date = ?,
      payload_json = ?,
      last_updated_at = ?,
      sync_state = 'DIRTY',
      updated_at = ?
    WHERE id = ? AND status = 'DRAFT'
    `,
    [
      shipName,
      imoNumber,
      signOnDate,
      signOffDate,
      JSON.stringify(payloadToStore),
      lastUpdatedAt,
      nowIso,
      recordId,
    ]
  );
}

/**
 * ============================================================
 * getActiveSeaServiceDraft
 * ============================================================
 * Returns the ONE active DRAFT record, if any.
 */
export function getActiveSeaServiceDraft(): SeaServiceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT
      id,
      ship_name AS shipName,
      imo_number AS imoNumber,
      sign_on_date AS signOnDate,
      sign_off_date AS signOffDate,
      payload_json AS payloadJson,
      status,
      last_updated_at AS lastUpdatedAt,
      remote_id AS remoteId,
      sync_state AS syncState,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM sea_service_records
    WHERE status = 'DRAFT'
    LIMIT 1
    `
  );

  const row = rows?.[0];
  if (!row) return null;

  const payload = safeParsePayload(String(row.payloadJson ?? ""));

  return {
    id: String(row.id),
    shipName: row.shipName ?? null,
    imoNumber: row.imoNumber ?? null,
    signOnDate: row.signOnDate ?? null,
    signOffDate: row.signOffDate ?? null,
    payload,
    status: "DRAFT",
    lastUpdatedAt: typeof row.lastUpdatedAt === "number" ? row.lastUpdatedAt : null,
    remoteId: row.remoteId ?? null,
    syncState: (row.syncState ?? "LOCAL_ONLY") as SyncState,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

/**
 * ============================================================
 * getSeaServiceFinalHistory
 * ============================================================
 * Returns all FINAL records for history list (latest first).
 */
export function getSeaServiceFinalHistory(): SeaServiceRecord[] {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT
      id,
      ship_name AS shipName,
      imo_number AS imoNumber,
      sign_on_date AS signOnDate,
      sign_off_date AS signOffDate,
      payload_json AS payloadJson,
      status,
      last_updated_at AS lastUpdatedAt,
      remote_id AS remoteId,
      sync_state AS syncState,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM sea_service_records
    WHERE status = 'FINAL'
    ORDER BY updated_at DESC
    `
  );

  return (rows ?? []).map((row: any) => {
    const payload = safeParsePayload(String(row.payloadJson ?? ""));
    return {
      id: String(row.id),
      shipName: row.shipName ?? null,
      imoNumber: row.imoNumber ?? null,
      signOnDate: row.signOnDate ?? null,
      signOffDate: row.signOffDate ?? null,
      payload,
      status: "FINAL",
      lastUpdatedAt:
        typeof row.lastUpdatedAt === "number" ? row.lastUpdatedAt : null,
      remoteId: row.remoteId ?? null,
      syncState: (row.syncState ?? "LOCAL_ONLY") as SyncState,
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    };
  });
}

/**
 * ============================================================
 * getSeaServiceById
 * ============================================================
 * Load a specific Sea Service record (DRAFT or FINAL).
 */
export function getSeaServiceById(id: string): SeaServiceRecord | null {
  const db = getDatabase();

  const rows = db.getAllSync<any>(
    `
    SELECT
      id,
      ship_name AS shipName,
      imo_number AS imoNumber,
      sign_on_date AS signOnDate,
      sign_off_date AS signOffDate,
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
    [id]
  );

  const row = rows?.[0];
  if (!row) return null;

  const payload = safeParsePayload(String(row.payloadJson ?? ""));

  return {
    id: String(row.id),
    shipName: row.shipName ?? null,
    imoNumber: row.imoNumber ?? null,
    signOnDate: row.signOnDate ?? null,
    signOffDate: row.signOffDate ?? null,
    payload,
    status: row.status === "FINAL" ? "FINAL" : "DRAFT",
    lastUpdatedAt: typeof row.lastUpdatedAt === "number" ? row.lastUpdatedAt : null,
    remoteId: row.remoteId ?? null,
    syncState: (row.syncState ?? "LOCAL_ONLY") as SyncState,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

/**
 * ============================================================
 * finalizeSeaService
 * ============================================================
 * Marks a DRAFT record as FINAL (locks lifecycle).
 *
 * IMPORTANT:
 * - Eligibility rules (sign-on/off + section completion) are enforced
 *   by the domain/UI layer BEFORE calling this.
 * - DB layer simply performs the status transition.
 */
export function finalizeSeaService(recordId: string): void {
  const db = getDatabase();
  const nowIso = new Date().toISOString();

  db.runSync(
    `
    UPDATE sea_service_records
    SET
      status = 'FINAL',
      sync_state = 'DIRTY',
      updated_at = ?
    WHERE id = ? AND status = 'DRAFT'
    `,
    [nowIso, recordId]
  );
}

/**
 * ============================================================
 * Backward-compat helpers (temporary)
 * ============================================================
 * These exist to avoid breaking older screens instantly.
 * We will cleanly refactor callers in the next steps.
 */

/**
 * Old name: getSeaServiceRecord()
 * New behavior:
 * - If DRAFT exists -> return it
 * - Else -> return most recent FINAL (if any)
 */
export function getSeaServiceRecord(): SeaServiceRecord | null {
  const draft = getActiveSeaServiceDraft();
  if (draft) return draft;

  const finals: SeaServiceRecord[] = getSeaServiceFinalHistory();
  return finals.length > 0 ? finals[0] : null;
}

/**
 * Old helper: getSeaServicePayloadOrDefault()
 * New behavior:
 * - If active draft exists -> return its payload
 * - Else return default payload
 */
export function getSeaServicePayloadOrDefault(): SeaServicePayload {
  const record = getActiveSeaServiceDraft();
  if (record?.payload) return record.payload;
  return DEFAULT_SEA_SERVICE_PAYLOAD;
}
