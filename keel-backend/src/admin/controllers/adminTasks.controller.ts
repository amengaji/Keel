import { Request, Response } from "express";
import { 
  TaskTemplate, 
  ShipType 
} from "../../models/index.js";

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await TaskTemplate.findAll({
      include: [
        {
          model: ShipType,
          as: "shipType",
          attributes: ["id", "name"],
        }
      ],
      order: [["id", "ASC"]],
    });

    // TRANSFORM DATA
    const formattedData = tasks.map((t: any) => ({
      id: t.id,
      task_code: t.stcw_reference || `TASK-${t.id}`,
      task_description: t.title,
      
      // Mapped Fields
      cadet_category: t.department || "General", 
      is_mandatory: t.mandatory_for_all,
      
      // NEW FIELDS (These were missing!)
      trainee_type: t.trainee_type || "All",
      instructions: t.instructions || "",
      safety_requirements: t.safety_requirements || "None",
      evidence_type: t.evidence_type || "NONE",
      verification_method: t.verification_method || "OBSERVATION",
      frequency: t.frequency || "ONCE",

      section: {
        name: t.section_name || "Uncategorized",
        shipType: t.shipType ? { name: t.shipType.name } : null
      }
    }));

    return res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await TaskTemplate.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ success: false, message: "Failed to delete task" });
  }
};
