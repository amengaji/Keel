//keel-backend/src/models/familiarisationProgress.controller.ts
import { Request, Response } from "express";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";

/**
 * Get progress for ONE section
 */
export const getSectionProgress = async (req: Request, res: Response) => {
  try {
    const { cadetId, vesselId, sectionId } = req.params;

    const tasks = await CadetFamiliarisationState.findAll({
      where: {
        cadet_id: cadetId,
        vessel_id: vesselId,
        section_id: sectionId,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found in this section." });
    }

    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === "MASTER_APPROVED").length;
    const submitted = tasks.filter((t: any) => t.status === "SUBMITTED").length;
    const rejected = tasks.filter((t: any) => t.status === "REJECTED").length;

    return res.json({
      success: true,
      section_id: sectionId,
      total_tasks: total,
      completed_tasks: completed,
      submitted_tasks: submitted,
      rejected_tasks: rejected,
      progress_percent: Math.round((completed / total) * 100),
    });
  } catch (err) {
    console.error("Progress error:", err);
    return res.status(500).json({ message: "Error generating progress" });
  }
};

/**
 * Get full familiarisation progress (all sections)
 */
export const getCadetOverallProgress = async (req: Request, res: Response) => {
  try {
    const { cadetId, vesselId } = req.params;

    const states = await CadetFamiliarisationState.findAll({
      where: { cadet_id: cadetId, vessel_id: vesselId },
      include: [
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
      ],
    });

    if (states.length === 0) {
      return res.json({
        success: true,
        message: "No familiarisation tasks yet.",
        total_tasks: 0,
        completed: 0,
        submitted: 0,
        rejected: 0,
        progress_percent: 0,
        section_breakdown: [],
      });
    }

    const total = states.length;
    const completed = states.filter((s: any) => s.status === "MASTER_APPROVED").length;
    const submitted = states.filter((s: any) => s.status === "SUBMITTED").length;
    const rejected = states.filter((s: any) => s.status === "REJECTED").length;

    // Group by section
    const sections: any = {};

    for (const s of states) {
      const sid = s.section_id;
      if (!sections[sid]) {
        sections[sid] = {
          section_id: sid,
          section_name: (s as any).section?.title ?? "Unknown",
          total: 0,
          completed: 0,
        };
      }
      sections[sid].total++;
      if (s.status === "MASTER_APPROVED") sections[sid].completed++;
    }

    const section_breakdown = Object.values(sections).map((sec: any) => ({
      ...sec,
      progress_percent: Math.round((sec.completed / sec.total) * 100),
    }));

    return res.json({
      success: true,
      total_tasks: total,
      completed,
      submitted,
      rejected,
      progress_percent: Math.round((completed / total) * 100),
      section_breakdown,
    });
  } catch (err) {
    console.error("Overall progress error:", err);
    return res.status(500).json({ message: "Error calculating progress" });
  }
};
