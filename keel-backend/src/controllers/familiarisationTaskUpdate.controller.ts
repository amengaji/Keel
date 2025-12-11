import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";

class FamiliarisationTaskUpdateController {
  static async updateTask(req: AuthRequest, res: Response) {
    try {
      const cadet = req.user;

      if (!cadet) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { task_id, status, cadet_comment } = req.body;

      if (!task_id || !status) {
        return res.status(400).json({
          message: "task_id and status are required"
        });
      }

      // Find cadet's task entry
      const entry = await CadetFamiliarisationState.findOne({
        where: {
          cadet_id: cadet.userId,
          task_id
        }
      });

      if (!entry) {
        return res.status(404).json({ message: "Task state not found" });
      }

      entry.set({
        status,
        cadet_comment: cadet_comment || entry.get("cadet_comment")
      });

      await entry.save();

      return res.json({
        success: true,
        message: "Task updated successfully",
        task: entry
      });

    } catch (err) {
      console.error("Task Update Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default FamiliarisationTaskUpdateController;
