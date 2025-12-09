import { Router } from "express";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import { authGuard } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

/**
 * ------------------------------------------------
 * CREATE SINGLE TASK
 * POST /fam-tasks
 * ------------------------------------------------
 */
router.post(
  "/",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const task = await FamiliarisationTaskTemplate.create(req.body);
      return res.status(201).json(task);
    } catch (err) {
      console.log("Create task error:", err);
      return res.status(500).json({ message: "Unable to create task" });
    }
  }
);

/**
 * ------------------------------------------------
 * GET ALL TASKS for the APP
 * GET /fam-tasks
 * ------------------------------------------------
 */
router.get("/", authGuard, async (req, res) => {
  try {
    const tasks = await FamiliarisationTaskTemplate.findAll({
      order: [["id", "ASC"]],
    });
    return res.json(tasks);
  } catch (err) {
    console.log("List tasks error:", err);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
});

/**
 * ------------------------------------------------
 * GET TASKS FOR SPECIFIC SECTION TEMPLATE
 * GET /fam-tasks/section/:sectionId
 * ------------------------------------------------
 */
router.get("/section/:sectionId", authGuard, async (req, res) => {
  try {
    const tasks = await FamiliarisationTaskTemplate.findAll({
      where: { section_template_id: req.params.sectionId },
      order: [["order_number", "ASC"]],
    });

    return res.json(tasks);
  } catch (err) {
    console.log("Get tasks by section error:", err);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
});

/**
 * ------------------------------------------------
 * GET TASKS BY CATEGORY
 * GET /fam-tasks/category/:category
 * ------------------------------------------------
 */
router.get("/category/:category", authGuard, async (req, res) => {
  try {
    const tasks = await FamiliarisationTaskTemplate.findAll({
      where: { cadet_category: req.params.category.toUpperCase() },
      order: [["order_number", "ASC"]],
    });

    return res.json(tasks);
  } catch (err) {
    console.log("Get tasks by category error:", err);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
});

/**
 * ------------------------------------------------
 * UPDATE TASK
 * PUT /fam-tasks/:id
 * ------------------------------------------------
 */
router.put(
  "/:id",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const id = req.params.id;

      const task = await FamiliarisationTaskTemplate.findByPk(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await task.update(req.body);

      return res.json({ message: "Task updated", task });
    } catch (err) {
      console.log("Update task error:", err);
      return res.status(500).json({ message: "Unable to update task" });
    }
  }
);

/**
 * ------------------------------------------------
 * DELETE TASK
 * DELETE /fam-tasks/:id
 * ------------------------------------------------
 */
router.delete(
  "/:id",
  authGuard,
  requireRole(["ADMIN", "SHORE"]),
  async (req, res) => {
    try {
      const id = req.params.id;

      const task = await FamiliarisationTaskTemplate.findByPk(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await task.destroy();
      return res.json({ message: "Task deleted" });
    } catch (err) {
      console.log("Delete task error:", err);
      return res.status(500).json({ message: "Unable to delete task" });
    }
  }
);

export default router;
