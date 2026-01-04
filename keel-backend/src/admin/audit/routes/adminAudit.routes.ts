// keel-backend/src/admin/audit/routes/adminAudit.routes.ts
//
// KEEL — Admin Audit Export Routes (READ-ONLY)
// --------------------------------------------
// PURPOSE:
// - Expose audit-safe export endpoints (CSV first)
// - Strictly READ-ONLY
// - No business logic here
//
// BASE PATH (mounted in src/index.ts):
//   /api/v1/admin/audit
//
// FINAL ENDPOINT (this file):
//   GET /audit-timeline/export.csv
//
// IMPORTANT AUDIT RULES:
// - No mutations
// - No writes
// - No deletes
// - No side effects
//

import { Router } from "express";
import { authGuard } from "../../../middleware/auth.middleware.js";
import {
  exportAuditTimelineCsv,
} from "../controllers/adminAudit.controller.js";

const router = Router();

/* -------------------------------------------------------------------------- */
/* GET — Audit Timeline Export (CSV)                                           */
/* -------------------------------------------------------------------------- */
/**
 * Downloads audit timeline as CSV.
 *
 * Characteristics:
 * - Streams CSV (no JSON wrapper)
 * - Safe for large datasets
 * - Column order is stable
 *
 * Query params (future-ready, not yet implemented):
 * - from      → ISO date
 * - to        → ISO date
 * - actorId   → UUID
 * - cadetId   → UUID
 * - vesselId  → UUID
 */
router.get(
  "/audit-timeline/export.csv",
  authGuard,
  exportAuditTimelineCsv
);

export default router;
