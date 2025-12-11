import { Request, Response } from "express";
import User from "../models/User.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

class FamiliarisationInitController {
  static async initialize(req: AuthRequest, res: Response) {
    try {
      const cadet = req.user; // added by authGuard

      if (!cadet) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { vessel_id } = req.body;

      if (!vessel_id) {
        return res.status(400).json({ message: "vessel_id is required" });
      }

      // Check if cadet exists
      const cadetUser = await User.findByPk(cadet.userId);
      if (!cadetUser) {
        return res.status(404).json({ message: "Cadet not found" });
      }

      // Get all tasks
      const tasks = await FamiliarisationTaskTemplate.findAll();
      if (tasks.length === 0) {
        return res
          .status(400)
          .json({ message: "No familiarisation tasks found" });
      }

      // Prepare records
      const newStates = tasks.map((task) => ({
        cadet_id: cadet.userId as number,
        vessel_id: vessel_id as number,
        section_id: task.get("section_template_id") as number,
        task_id: task.get("id") as number,
        status: "NOT_STARTED" as const,
      }));

      // Bulk create (ignore duplicates)
      await CadetFamiliarisationState.bulkCreate(newStates, {
        ignoreDuplicates: true,
      });

      return res.json({
        success: true,
        created_count: newStates.length,
      });
    } catch (err) {
      console.error("Init Familiarisation Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default FamiliarisationInitController;
