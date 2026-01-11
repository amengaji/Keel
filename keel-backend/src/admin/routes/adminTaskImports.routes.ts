import { Router } from "express";
import multer from "multer";
import { authGuard } from "../../middleware/auth.middleware.js";
import {
  downloadCadetImportTemplate,
  previewCadetImport,
  commitCadetImport,
  // Add these:
  downloadTaskImportTemplate,
  previewTaskImport,
  commitTaskImport,
} from "../controllers/adminImports.controller.js";


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/* CADETS */
router.get("/imports/cadets/template", authGuard, downloadCadetImportTemplate);
router.post("/imports/cadets/preview", authGuard, upload.single("file"), previewCadetImport);
router.post("/imports/cadets/commit", authGuard, upload.single("file"), commitCadetImport);

/* TASKS */
router.get("/imports/tasks/template", authGuard, downloadTaskImportTemplate);
router.post("/imports/tasks/preview", authGuard, upload.single("file"), previewTaskImport);
router.post("/imports/tasks/commit", authGuard, upload.single("file"), commitTaskImport);

export default router;