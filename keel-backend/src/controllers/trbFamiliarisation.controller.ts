import { Request, Response } from "express";
import CadetFamiliarisationState from "../models/CadetFamiliarisationState.js";
import CadetFamiliarisationAttachment from "../models/CadetFamiliarisationAttachment.js";
import User from "../models/User.js";
import Vessel from "../models/Vessel.js";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "../models/FamiliarisationTaskTemplate.js";

/**
 * TRB Familiarisation Summary for one cadet on one vessel
 *
 * GET /api/trb/familiarisation/:cadetId/:vesselId
 */
export const getFamiliarisationSummary = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { cadetId, vesselId } = req.params;

    const states = await CadetFamiliarisationState.findAll({
      where: {
        cadet_id: cadetId,
        vessel_id: vesselId,
      },
      include: [
        { model: User, as: "cadet", attributes: ["id", "full_name"] },
        { model: Vessel, as: "vessel", attributes: ["id", "name", "imo_number"] },
        { model: FamiliarisationSectionTemplate, as: "section" },
        { model: FamiliarisationTaskTemplate, as: "task" },
        { model: CadetFamiliarisationAttachment, as: "attachments" },
      ],
      order: [
        ["section_id", "ASC"],
        ["task_id", "ASC"],
      ],
    });

    if (states.length === 0) {
      return res.json({
        success: true,
        message: "No familiarisation records found for this cadet and vessel.",
        cadet: null,
        vessel: null,
        totals: {
          total_tasks: 0,
          completed: 0,
          submitted: 0,
          rejected: 0,
          progress_percent: 0,
        },
        sections: [],
      });
    }

    const first: any = states[0];
    const cadet = first.cadet;
    const vessel = first.vessel;

    const totalTasks = states.length;
    const completed = states.filter((s: any) => s.status === "MASTER_APPROVED").length;
    const submitted = states.filter((s: any) => s.status === "SUBMITTED").length;
    const rejected = states.filter((s: any) => s.status === "REJECTED").length;

    const progressPercent =
      totalTasks === 0 ? 0 : Math.round((completed / totalTasks) * 100);

    const sectionMap: Record<string, any> = {};

    for (const item of states) {
      const s: any = item;

      const sectionId = String(s.section_id);
      const section = s.section;
      const task = s.task;

      if (!sectionMap[sectionId]) {
        sectionMap[sectionId] = {
          section_id: s.section_id,
          section_code: section?.section_code ?? null,
          section_title: section?.title ?? "Untitled Section",
          order_number: section?.order_number ?? null,
          tasks: [],
        };
      }

      const attachments =
        (s.attachments || []).map((att: any) => ({
          id: att.id,
          file_url: att.file_url,
          file_name: att.file_name,
          uploaded_at: att.createdAt,
        })) ?? [];

      sectionMap[sectionId].tasks.push({
        state_id: s.id,
        task_id: s.task_id,
        task_code: task?.task_code ?? null,
        task_description: task?.task_description ?? "",
        is_mandatory: task?.is_mandatory ?? true,
        status: s.status,
        cadet_comment: s.cadet_comment,
        submitted_at: s.submitted_at,
        cto_signed_at: s.cto_signed_at,
        master_signed_at: s.master_signed_at,
        rejection_comment: s.rejection_comment,
        attachments,
      });
    }

    const sections = Object.values(sectionMap).sort((a: any, b: any) => {
      const oa = a.order_number ?? 0;
      const ob = b.order_number ?? 0;
      return oa - ob;
    });

    return res.json({
      success: true,
      cadet: cadet
        ? {
            id: cadet.id,
            full_name: cadet.full_name,
          }
        : null,
      vessel: vessel
        ? {
            id: vessel.id,
            name: vessel.name,
            imo_number: vessel.imo_number,
          }
        : null,
      totals: {
        total_tasks: totalTasks,
        completed,
        submitted,
        rejected,
        progress_percent: progressPercent,
      },
      sections,
    });
  } catch (err) {
    console.error("TRB Familiarisation Summary Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error generating familiarisation summary." });
  }
};
