// keel-backend/src/admin/routes/adminImports.routes.ts
//
// PURPOSE:
// - Admin Imports (Preview-first, audit-safe)
// - Cadet Excel preview (NO WRITES)
// - Cadet Excel commit (STRICT WRITES; transaction; admin-only)
// - Cadet Excel template download
//
// ROUTES:
// - GET  /api/v1/admin/imports/cadets/template
// - POST /api/v1/admin/imports/cadets/preview
// - POST /api/v1/admin/imports/cadets/commit
//

import { Router } from "express";
import multer from "multer";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  downloadCadetImportTemplate,
  previewCadetImport,
  commitCadetImport,
} from "../controllers/adminImports.controller.js";

const router = Router();

// Memory storage keeps this audit-safe and simple (no temp files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/* ======================================================================
 * TEMPLATE
 * ====================================================================== */

router.get("/imports/cadets/template", authGuard, downloadCadetImportTemplate);

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

router.post(
  "/imports/cadets/preview",
  authGuard,
  upload.single("file"),
  previewCadetImport
);

/* ======================================================================
 * COMMIT (STRICT WRITES)
 * ====================================================================== */

router.post(
  "/imports/cadets/commit",
  authGuard,
  upload.single("file"),
  commitCadetImport
);

export default router;
