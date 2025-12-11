//keel-backend/src/models/familiarisationReview.controller.ts
import { Request, Response } from "express";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import CadetFamiliarisationAttachment from "../models/CadetFamiliarisationAttachment.js";
import User from "../models/User.js";
import Vessel from "../models/Vessel.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

/**
 * CTO DASHBOARD – Pending submissions
 */
export const getCtoPendingTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await CadetFamiliarisationState.findAll({
      where: { status: "SUBMITTED" },
      include: [
        { model: User, as: "cadet", attributes: ["id", "full_name"] },
        { model: Vessel, as: "vessel", attributes: ["id", "name", "imo_number"] },
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
        { model: CadetFamiliarisationAttachment, as: "attachments" },
      ],
      order: [["submitted_at", "DESC"]],
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("CTO Pending Error:", err);
    return res.status(500).json({ message: "Error fetching CTO pending tasks." });
  }
};

/**
 * CTO DASHBOARD – History (Approved or Rejected)
 */
export const getCtoHistory = async (req: Request, res: Response) => {
  try {
    const tasks = await CadetFamiliarisationState.findAll({
      where: {
        status: ["CTO_APPROVED", "REJECTED"],
      },
      include: [
        { model: User, as: "cadet", attributes: ["id", "full_name"] },
        { model: Vessel, as: "vessel", attributes: ["id", "name"] },
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
      ],
      order: [["updatedAt", "DESC"]],
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("CTO History Error:", err);
    return res.status(500).json({ message: "Error fetching CTO history." });
  }
};

/**
 * MASTER DASHBOARD – Pending tasks
 */
export const getMasterPendingTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await CadetFamiliarisationState.findAll({
      where: { status: "CTO_APPROVED" },
      include: [
        { model: User, as: "cadet", attributes: ["id", "full_name"] },
        { model: Vessel, as: "vessel", attributes: ["id", "name"] },
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
        { model: CadetFamiliarisationAttachment, as: "attachments" },
      ],
      order: [["cto_signed_at", "DESC"]],
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("Master Pending Error:", err);
    return res.status(500).json({ message: "Error fetching Master pending tasks." });
  }
};


// ------------------ CTO APPROVAL ------------------
export async function approveByCto(req: AuthRequest, res: Response) {
  try {
    const user = req.user;

    if (!user || user.role !== "CTO") {
      return res.status(403).json({ message: "Only CTO can approve tasks" });
    }

    const { cadet_id, section_id, comment } = req.body;

    if (!cadet_id || !section_id) {
      return res
        .status(400)
        .json({ message: "cadet_id and section_id are required" });
    }

    const tasks = await CadetFamiliarisationState.findAll({
      where: {
        cadet_id,
        section_id,
        status: "SUBMITTED",
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No submitted tasks found for CTO review",
      });
    }

    const now = new Date();

    let updated = 0;

    for (const t of tasks) {
      t.status = "CTO_APPROVED";
      t.cto_signed_at = now;
      t.rejection_comment = comment || null;
      await t.save();
      updated++;
    }

    return res.json({
      success: true,
      message: "CTO approved all submitted tasks",
      updated_count: updated,
    });
  } catch (err) {
    console.error("CTO Approval Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// ------------------ MASTER APPROVAL ------------------
export async function approveByMaster(req: AuthRequest, res: Response) {
  try {
    const user = req.user;

    if (!user || user.role !== "MASTER") {
      return res.status(403).json({ message: "Only MASTER can approve tasks" });
    }

    const { cadet_id, section_id, comment } = req.body;

    if (!cadet_id || !section_id) {
      return res
        .status(400)
        .json({ message: "cadet_id and section_id are required" });
    }

    const tasks = await CadetFamiliarisationState.findAll({
      where: {
        cadet_id,
        section_id,
        status: "CTO_APPROVED",
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No CTO-approved tasks found for Master review",
      });
    }

    const now = new Date();

    let updated = 0;

    for (const t of tasks) {
      t.status = "MASTER_APPROVED";
      t.master_signed_at = now;
      t.rejection_comment = comment || null;
      await t.save();
      updated++;
    }

    return res.json({
      success: true,
      message: "Master approved all CTO-reviewed tasks",
      updated_count: updated,
    });
  } catch (err) {
    console.error("Master Approval Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * MASTER DASHBOARD – History (Approved tasks)
 */
export const getMasterHistory = async (req: Request, res: Response) => {
  try {
    const tasks = await CadetFamiliarisationState.findAll({
      where: {
        status: "MASTER_APPROVED",
      },
      include: [
        { model: User, as: "cadet", attributes: ["id", "full_name"] },
        { model: Vessel, as: "vessel" },
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
      ],
      order: [["master_signed_at", "DESC"]],
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    console.error("Master History Error:", err);
    return res.status(500).json({ message: "Error fetching Master history." });
  }
};
