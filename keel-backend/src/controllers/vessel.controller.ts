import { Request, Response } from "express";
import Vessel from "../models/Vessel.js";
import ShipType from "../models/ShipType.js";

class VesselController {
  // Create new vessel (Admin/Shore only)
  static async create(req: Request, res: Response) {
    try {
      const {
        name,
        imo_number,
        ship_type_id,
        call_sign,
        mmsi,
        flag,
        port_of_registry,
        classification_society,
        builder,
        year_built,
        gross_tonnage,
        net_tonnage,
        deadweight_tonnage,
        length_overall_m,
        breadth_moulded_m,
        depth_m,
        draught_summer_m,
        main_engine_type,
        main_engine_model,
        main_engine_power_kw,
        aux_engine_details,
        service_speed_knots,
        owner_company,
        manager_company,
        operating_area,
        ice_class,
        last_drydock_date,
        next_drydock_date,
        last_special_survey_date,
        next_special_survey_date,
      } = req.body;

      if (!name || !imo_number || !ship_type_id) {
        return res.status(400).json({
          message: "name, imo_number and ship_type_id are required",
        });
      }

      // Optional: verify ship type exists
      const shipType = await ShipType.findByPk(ship_type_id);
      if (!shipType) {
        return res.status(400).json({ message: "Invalid ship_type_id" });
      }

      const vessel = await Vessel.create({
        name,
        imo_number,
        ship_type_id,
        call_sign,
        mmsi,
        flag,
        port_of_registry,
        classification_society,
        builder,
        year_built,
        gross_tonnage,
        net_tonnage,
        deadweight_tonnage,
        length_overall_m,
        breadth_moulded_m,
        depth_m,
        draught_summer_m,
        main_engine_type,
        main_engine_model,
        main_engine_power_kw,
        aux_engine_details,
        service_speed_knots,
        owner_company,
        manager_company,
        operating_area,
        ice_class,
        last_drydock_date,
        next_drydock_date,
        last_special_survey_date,
        next_special_survey_date,
      });

      return res.status(201).json(vessel);
    } catch (err) {
      console.error("Create Vessel error:", err);
      return res.status(500).json({ message: "Unable to create vessel" });
    }
  }

  // Get all vessels (any logged-in user)
  static async getAll(req: Request, res: Response) {
    try {
      const vessels = await Vessel.findAll({
        include: [{ model: ShipType, as: "shipType" }],
      });
      return res.json(vessels);
    } catch (err) {
      console.error("Get all vessels error:", err);
      return res.status(500).json({ message: "Unable to fetch vessels" });
    }
  }

  // Get one vessel
  static async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vessel = await Vessel.findByPk(id, {
        include: [{ model: ShipType, as: "shipType" }],
      });

      if (!vessel) {
        return res.status(404).json({ message: "Vessel not found" });
      }

      return res.json(vessel);
    } catch (err) {
      console.error("Get vessel error:", err);
      return res.status(500).json({ message: "Unable to fetch vessel" });
    }
  }

  // Delete vessel (Admin/Shore)
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await Vessel.destroy({ where: { id } });

      if (!deleted) {
        return res.status(404).json({ message: "Vessel not found" });
      }

      return res.json({ message: "Vessel deleted" });
    } catch (err) {
      console.error("Delete vessel error:", err);
      return res.status(500).json({ message: "Unable to delete vessel" });
    }
  }
}

export default VesselController;
