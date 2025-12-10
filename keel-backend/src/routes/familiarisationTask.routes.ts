//keel-backend/src/models/CadetFamiliarisationAttachment.ts
import express from "express";
import {
  startTask,
  updateTask,
  uploadAttachment,
  submitTask,
  ctoApprove,
  ctoReject,
  masterApprove,
} from "../controllers/familiarisationTask.controller.js";

import { authGuard } from "../middleware/auth.middleware.js";

const router = express.Router();

// Cadet workflow
router.post("/task/:stateId/start", authGuard, startTask);
router.put("/task/:stateId/update", authGuard, updateTask);
router.post("/task/:stateId/attachment", authGuard, uploadAttachment);
router.post("/task/:stateId/submit", authGuard, submitTask);

// CTO workflow
router.post("/task/:stateId/cto-approve", authGuard, ctoApprove);
router.post("/task/:stateId/cto-reject", authGuard, ctoReject);

// Master workflow
router.post("/task/:stateId/master-approve", authGuard, masterApprove);

export default router;
