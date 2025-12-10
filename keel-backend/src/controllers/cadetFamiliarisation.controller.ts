//keel-backend/src/controllers/cadetFamiliarisation.controller.ts
import { Request, Response } from "express";
import User from "../models/User.js";
import Vessel from "../models/Vessel.js";
import CadetVesselAssignment from "../models/CadetVesselAssignment.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";

/**
 * Assign a cadet to a vessel and auto-generate familiarisation tasks.
 */
export const assignCadetToVessel = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { cadetId } = req.params;
    const { vessel_id } = req.body;

    // 1. Validate cadet
    const cadet = await User.findByPk(cadetId);
    if (!cadet) {
      return res.status(404).json({ success: false, message: "Cadet not found" });
    }

    // 2. Validate vessel
    const vessel = await Vessel.findByPk(vessel_id);
    if (!vessel) {
      return res.status(404).json({ success: false, message: "Vessel not found" });
    }

    // 3. Close any existing active assignments
    await CadetVesselAssignment.update(
      {
        status: "COMPLETED",
        end_date: new Date(),
      },
      {
        where: {
          cadet_id: cadetId,
          status: "ACTIVE",
        },
      }
    );

    // 4. Create new assignment
    await CadetVesselAssignment.create({
      cadet_id: Number(cadetId),
      vessel_id,
      start_date: new Date(),
      status: "ACTIVE",
    });

    // 5. Update User.current_vessel_id
    await cadet.update({ current_vessel_id: vessel_id });

    // 6. Fetch familiarisation sections for the cadet category
    const cadetCategory = (cadet as any).cadet_category;

    const sections = await FamiliarisationSectionTemplate.findAll({
      where: { cadet_category: cadetCategory },
    });

    if (sections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No familiarisation sections found for this cadet category",
      });
    }

    const sectionIds = sections.map((s) => s.getDataValue("id"));

    // 7. Fetch tasks under these sections
    const tasks = await FamiliarisationTaskTemplate.findAll({
      where: {
        section_template_id: sectionIds,
        cadet_category: cadetCategory,
      },
    });

    if (tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No familiarisation tasks found under the sections",
      });
    }

    // 8. Build state rows
    const states = tasks.map((task) => ({
      cadet_id: Number(cadetId),
      vessel_id,
      section_id: task.getDataValue("section_template_id"),
      task_id: task.getDataValue("id"),
      status: "NOT_STARTED" as const,
    }));

    // 9. Bulk create familiarisation state
    await CadetFamiliarisationState.bulkCreate(states);

    return res.json({
      success: true,
      message: "Cadet assigned to vessel and familiarisation tasks generated",
      sections_count: sections.length,
      tasks_count: tasks.length,
    });
  } catch (error) {
    console.error("AssignCadetToVessel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error assigning cadet to vessel",
    });
  }
};
