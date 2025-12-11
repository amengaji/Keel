import { Request, Response } from "express";
import User from "../models/User.js";
import Vessel from "../models/Vessel.js";

class VesselAssignmentController {
  static async assignCadet(req: Request, res: Response) {
    try {
      const { cadet_id, vessel_id } = req.body;

      if (!cadet_id || !vessel_id) {
        return res
          .status(400)
          .json({ message: "cadet_id and vessel_id are required" });
      }

      // Ensure cadet exists
      const cadet = await User.findByPk(cadet_id);
      if (!cadet) {
        return res.status(404).json({ message: "Cadet not found" });
      }

      // Ensure vessel exists
      const vessel = await Vessel.findByPk(vessel_id);
      if (!vessel) {
        return res.status(404).json({ message: "Vessel not found" });
      }

      // Assign vessel
      cadet.set("current_vessel_id", vessel_id);
      await cadet.save();

      return res.json({
        success: true,
        message: "Cadet assigned to vessel",
        data: cadet,
      });
    } catch (err) {
      console.error("assignCadet error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default VesselAssignmentController;
