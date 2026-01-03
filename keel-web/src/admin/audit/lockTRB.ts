// keel-web/src/admin/audit/lockTRB.ts
//
// Keel — TRB Final Lock (Shared Helper)
// ----------------------------------------------------
// MODULE: 2.4C (Shared + Page Integration)
//
// PURPOSE:
// - Single source of truth for TRB locking (UX-only mock)
// - Generates audit-grade lock record
// - Produces an audit log entry (who/when/hash)
// - Allows Dashboard + AuditTRBPage to read the latest lock
//
// IMPORTANT:
// - No backend calls
// - In-memory mock store only (refresh clears it)
// - Future backend: replace store writes with API call
//
// NOTE ON SECURITY:
// - Hash here is mock. In production, hash must be created server-side.

export type TraineeCategory =
  | "DECK_CADET"
  | "ENGINE_CADET"
  | "ETO_CADET"
  | "DECK_RATING"
  | "ENGINE_RATING";

export type AuthorityRole =
  | "SHORE_ADMIN"
  | "MASTER"
  | "CHIEF_ENGINEER"
  | "CTO_DECK" // Chief Officer acting as CTO for Deck
  | "CTO_ENGINE" // 2nd Engineer acting as CTO for Engine
  | "UNKNOWN";

export type AuditLogAction = "TRB_LOCKED";

export type AuditLogEntry = {
  id: string;
  action: AuditLogAction;
  trbRef: string;

  cadetName: string;
  traineeCategory: TraineeCategory;
  vesselName: string;
  vesselImo: string;

  lockedByRole: AuthorityRole;
  lockedAtIso: string;

  hash: string;
  note: string;
};

export type TRBLockRecord = {
  trbRef: string;
  isLocked: boolean;

  cadetName: string;
  traineeCategory: TraineeCategory;
  vesselName: string;
  vesselImo: string;

  lockedByRole: AuthorityRole;
  lockedAtIso: string;

  hash: string;

  auditLogEntry: AuditLogEntry;
};

/* -------------------------------------------------------------------------- */
/* In-memory mock store                                                       */
/* -------------------------------------------------------------------------- */
let latestLockRecord: TRBLockRecord | null = null;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */
function buildId(prefix: string): string {
  // Helper: generates a readable id for mock log entries
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${t}-${r}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildMockHash(input: string): string {
  // IMPORTANT: This is a mock “hash-like” formatter for UX.
  // Production must generate a cryptographic hash server-side.
  const base = input
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .padEnd(20, "0")
    .slice(0, 20);

  return `${base.slice(0, 4)}-${base.slice(4, 8)}-${base.slice(8, 12)}-${base.slice(
    12,
    16
  )}-${base.slice(16, 20)}`;
}

/* -------------------------------------------------------------------------- */
/* Public API (shared)                                                       */
/* -------------------------------------------------------------------------- */
export function lockTRB(args: {
  trbRef: string;
  cadetName: string;
  traineeCategory: TraineeCategory;
  vesselName: string;
  vesselImo: string;
  lockedByRole: AuthorityRole;
}): TRBLockRecord {
  const lockedAtIso = nowIso();

  const seed = `${args.trbRef}|${args.cadetName}|${args.vesselImo}|${lockedAtIso}|${args.lockedByRole}`;
  const hash = buildMockHash(seed);

  const auditLogEntry: AuditLogEntry = {
    id: buildId("AUDIT"),
    action: "TRB_LOCKED",
    trbRef: args.trbRef,

    cadetName: args.cadetName,
    traineeCategory: args.traineeCategory,
    vesselName: args.vesselName,
    vesselImo: args.vesselImo,

    lockedByRole: args.lockedByRole,
    lockedAtIso,

    hash,
    note: "Final lock applied. Record is now immutable (mock).",
  };

  const record: TRBLockRecord = {
    trbRef: args.trbRef,
    isLocked: true,

    cadetName: args.cadetName,
    traineeCategory: args.traineeCategory,
    vesselName: args.vesselName,
    vesselImo: args.vesselImo,

    lockedByRole: args.lockedByRole,
    lockedAtIso,

    hash,
    auditLogEntry,
  };

  latestLockRecord = record;
  return record;
}

export function getLatestTRBLockRecord(): TRBLockRecord | null {
  return latestLockRecord;
}

export function clearLatestTRBLockRecord(): void {
  latestLockRecord = null;
}
