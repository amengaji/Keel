import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";

class FamiliarisationSectionSubmitController {
  static async submitSection(req: AuthRequest, res: Response) {
    try {
      const cadet = req.user;

      if (!cadet) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { section_id } = req.body;

      if (!section_id) {
        return res
          .status(400)
          .json({ message: "section_id is required" });
      }

      // Find all tasks for this section & cadet
      const tasks = await CadetFamiliarisationState.findAll({
        where: {
          cadet_id: cadet.userId,
          section_id
        }
      });

      if (tasks.length === 0) {
        return res
          .status(404)
          .json({ message: "No familiarisation tasks found for this section" });
      }

      // Update all tasks → SUBMITTED
      const now = new Date();

      for (const task of tasks) {
        task.set({
          status: "SUBMITTED",
          submitted_at: now
        });
        await task.save();
      }

      return res.json({
        success: true,
        message: "Section submitted for review",
        updated_count: tasks.length
      });
    } catch (err) {
      console.error("Section Submit Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default FamiliarisationSectionSubmitController;
