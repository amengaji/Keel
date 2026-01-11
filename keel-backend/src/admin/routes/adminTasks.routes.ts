import { Router } from "express";
import { getAllTasks, deleteTask } from "../controllers/adminTasks.controller.js";
// import { authGuard, roleGuard } from "../../middleware/auth.middleware.js"; // Uncomment when ready

const router = Router();

// Retrieve all tasks
router.get("/tasks", getAllTasks);

// Delete a task
router.delete("/tasks/:id", deleteTask);

export default router;