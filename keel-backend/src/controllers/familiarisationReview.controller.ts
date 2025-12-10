//keel-backend/src/models/familiarisationReview.controller.ts
import { Request, Response } from "express";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import CadetFamiliarisationAttachment from "../models/CadetFamiliarisationAttachment.js";
import User from "../models/User.js";
import Vessel from "../models/Vessel.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";

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
