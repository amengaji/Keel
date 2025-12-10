//keel-backend/src/models/CadetFamiliarisationAttachment.ts
import { Request, Response } from "express";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import CadetFamiliarisationAttachment from "../models/CadetFamiliarisationAttachment.js";

/**
 * 1. Cadet starts a task
 */
export const startTask = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    if (state.status === "NOT_STARTED") {
      await state.update({ status: "IN_PROGRESS" });
    }

    return res.json({ success: true, status: state.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error starting task" });
  }
};

/**
 * 2. Cadet updates comment
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;
    const { cadet_comment } = req.body;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await state.update({
      cadet_comment,
      status: "IN_PROGRESS",
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating task" });
  }
};

/**
 * 3. Upload attachment
 */
export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;
    const { file_url, file_name } = req.body; // S3 URL from frontend

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await CadetFamiliarisationAttachment.create({
      state_id: Number(stateId),
      file_url,
      file_name,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error uploading attachment" });
  }
};

/**
 * 4. Cadet submits the task
 */
export const submitTask = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await state.update({
      status: "SUBMITTED",
      submitted_at: new Date(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error submitting task" });
  }
};

/**
 * 5. CTO approves task
 */
export const ctoApprove = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await state.update({
      status: "CTO_APPROVED",
      cto_signed_at: new Date(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error approving task" });
  }
};

/**
 * 6. CTO rejects task
 */
export const ctoReject = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;
    const { rejection_comment } = req.body;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await state.update({
      status: "REJECTED",
      rejection_comment,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error rejecting task" });
  }
};

/**
 * 7. Master approves task
 */
export const masterApprove = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;

    const state = await CadetFamiliarisationState.findByPk(stateId);
    if (!state) return res.status(404).json({ message: "Task not found" });

    await state.update({
      status: "MASTER_APPROVED",
      master_signed_at: new Date(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error approving task" });
  }
};
