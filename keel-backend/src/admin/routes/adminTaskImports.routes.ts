import { Router } from "express";
import multer from "multer";

// USE YOUR EXISTING MIDDLEWARE
import { authGuard } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

import {
  downloadTaskImportTemplate,
  previewTaskImport,
  commitTaskImport,
} from "../controllers/adminImports.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Authenticate (Check Cookie/Token)
router.use(authGuard);

// 2. Authorize (Check Role)
// Allowing ADMIN and SHORE roles to import tasks
router.use(requireRole(["ADMIN", "SHORE"]));

// --- ROUTES ---
router.get("/imports/tasks/template", downloadTaskImportTemplate);
router.post("/imports/tasks/preview", upload.single("file"), previewTaskImport);
router.post("/imports/tasks/commit", upload.single("file"), commitTaskImport);

export default router;
