import { Router } from "express";
import { authGuard } from "../middleware/auth.middleware.js";
import FamiliarisationTaskUpdateController from "../controllers/familiarisationTaskUpdate.controller.js";

const router = Router();

router.put("/familiarisation/task/update", authGuard, FamiliarisationTaskUpdateController.updateTask);

export default router;
