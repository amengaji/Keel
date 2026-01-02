// keel-web/src/admin/security/auditData.ts
//
// MODULE 2.2A — Audit Data Layer (Mock)
// ------------------------------------
// Purpose:
// - Deterministic audit records
// - Ghost signature envelopes
// - No backend, no Dexie yet
// - Safe foundation for Phase 3 sync

export type Role =
  | "CADET"
  | "CTO"
  | "MASTER"
  | "SHORE_ADMIN";

export type SignatureEnvelope = {
  taskId: string;
  signedByRole: Role;
  signerName: string;
  signedAt: string;
  signatureHash: string;
};

export type AuditRecord = {
  trbId: string;
  cadetName: string;
  vesselName: string;
  envelopes: SignatureEnvelope[];
  finalizedAt?: string;
  finalHash?: string;
};

/* -------------------------------------------------------------------------- */
/* Mock Data                                                                   */
/* -------------------------------------------------------------------------- */

export const mockAuditRecord: AuditRecord = {
  trbId: "KEEL-TRB-009381",
  cadetName: "Rahul Sharma",
  vesselName: "MV Ocean Pioneer",
  envelopes: [
    {
      taskId: "1.1",
      signedByRole: "CADET",
      signerName: "Rahul Sharma",
      signedAt: "2026-01-10T21:40:00Z",
      signatureHash: "cadet-abc-123",
    },
    {
      taskId: "1.1",
      signedByRole: "CTO",
      signerName: "Chief Engineer",
      signedAt: "2026-01-12T08:15:00Z",
      signatureHash: "cto-def-456",
    },
    {
      taskId: "1.1",
      signedByRole: "MASTER",
      signerName: "Master",
      signedAt: "2026-01-14T19:30:00Z",
      signatureHash: "master-ghi-789",
    },
  ],
  finalizedAt: "2026-01-18T06:10:00Z",
  finalHash: "final-9F3A-D2E1-A7C4-B990",
};
