import { Router } from "express";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Bulk create tasks
router.post("/", authGuard, requireRole(["ADMIN", "SHORE"]), async (req, res) => {
  try {
    const tasks = req.body.tasks;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: "tasks[] is required" });
    }

    const created = await FamiliarisationTaskTemplate.bulkCreate(tasks);

    return res.status(201).json({ message: "Bulk tasks created", count: created.length, created });
  } catch (err) {
    console.log("Bulk task insert error:", err);
    return res.status(500).json({ message: "Unable to insert bulk tasks" });
  }
});

export default router;
