// keel-backend/src/admin/routes/adminVesselImports.routes.ts
//
// PURPOSE:
// - Admin Vessel Imports (Preview-first, audit-safe)
// - Vessel Excel template download
// - Vessel Excel preview (NO WRITES)
// - Vessel Excel commit (STRICT, transactional)
//
// ROUTES:
// - GET  /api/v1/admin/imports/vessels/template
// - POST /api/v1/admin/vessels/import/preview
// - POST /api/v1/admin/imports/vessels/commit
//

import { Router } from "express";
import multer from "multer";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  downloadVesselImportTemplate,
  previewVesselImport,
  commitVesselImport,
} from "../controllers/adminVesselImports.controller.js";

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

router.get(
  "/imports/vessels/template",
  authGuard,
  downloadVesselImportTemplate
);

/* ======================================================================
 * PREVIEW (NO WRITES)
 * ====================================================================== */

router.post(
  "/imports/vessels/preview",
  authGuard,
  (req, _res, next) => {
    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      return next(new Error("Request must be multipart/form-data"));
    }
    next();
  },
  upload.single("file"),
  previewVesselImport
);


/* ======================================================================
 * COMMIT (STRICT WRITES — Policy B)
 * ====================================================================== */

router.post(
  "/imports/vessels/commit",
  authGuard,
  upload.single("file"),
  commitVesselImport
);

export default router;
