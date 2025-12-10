//keel-backend/src/controllers/famTaskTemplate.controller.ts
import { Request, Response } from "express";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";

class FamTaskTemplateController {
  // Create a task template
  static async create(req: Request, res: Response) {
    try {
      const {
        section_template_id,
        cadet_category,
        task_code,
        task_description,
        order_number,
        is_mandatory
      } = req.body;

      if (!section_template_id || !cadet_category || !task_code || !task_description || !order_number) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // verify section exists
      const section = await FamiliarisationSectionTemplate.findByPk(section_template_id);
      if (!section) {
        return res.status(400).json({ message: "Invalid section_template_id" });
      }

      const task = await FamiliarisationTaskTemplate.create({
        section_template_id,
        cadet_category,
        task_code,
        task_description,
        order_number,
        is_mandatory: is_mandatory ?? true,
      });

      return res.status(201).json(task);
    } catch (err) {
      console.error("Create Task Template Error:", err);
      return res.status(500).json({ message: "Unable to create task template" });
    }
  }

  // Get tasks for a section
  static async getBySection(req: Request, res: Response) {
    try {
      const { section_template_id } = req.params;

      const tasks = await FamiliarisationTaskTemplate.findAll({
        where: { section_template_id },
        order: [["order_number", "ASC"]],
      });

      return res.json(tasks);
    } catch (err) {
      console.error("Get Task Templates error:", err);
      return res.status(500).json({ message: "Unable to fetch task templates" });
    }
  }

  // Delete a task template
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await FamiliarisationTaskTemplate.destroy({ where: { id } });

      if (!result) {
        return res.status(404).json({ message: "Task not found" });
      }

      return res.json({ message: "Task deleted" });
    } catch (err) {
      console.error("Delete Task Template error:", err);
      return res.status(500).json({ message: "Unable to delete task template" });
    }
  }
}

export default FamTaskTemplateController;
