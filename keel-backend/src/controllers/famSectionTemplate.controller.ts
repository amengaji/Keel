//keel-backend/src/controllers/famSectionTemplate.controller.ts
import { Request, Response } from "express";
import FamiliarisationSectionTemplate from "../models/FamiliarisationSectionTemplate.js";
import ShipType from "../models/ShipType.js";

class FamSectionTemplateController {
  // Create a section template (Admin/Shore only)
  static async create(req: Request, res: Response) {
    try {
      const { ship_type_id, cadet_category, section_code, title, order_number } = req.body;

      if (!ship_type_id || !cadet_category || !section_code || !title || !order_number) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify ship type exists
      const shipType = await ShipType.findByPk(ship_type_id);
      if (!shipType) {
        return res.status(400).json({ message: "Invalid ship_type_id" });
      }

      const section = await FamiliarisationSectionTemplate.create({
        ship_type_id,
        cadet_category,
        section_code,
        title,
        order_number,
      });

      return res.status(201).json(section);
    } catch (err) {
      console.error("Create Section Template Error:", err);
      return res.status(500).json({ message: "Unable to create section template" });
    }
  }

  // Get all familiarisation section templates for ship type & cadet category
  static async getByTypeAndCategory(req: Request, res: Response) {
    try {
      const { ship_type_id, cadet_category } = req.params;

      const sections = await FamiliarisationSectionTemplate.findAll({
        where: { ship_type_id, cadet_category },
        order: [["order_number", "ASC"]],
      });

      return res.json(sections);
    } catch (err) {
      console.error("Get Section Templates error:", err);
      return res.status(500).json({ message: "Unable to fetch section templates" });
    }
  }

  // Delete a section template
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await FamiliarisationSectionTemplate.destroy({ where: { id } });

      if (!result) {
        return res.status(404).json({ message: "Section not found" });
      }

      return res.json({ message: "Section deleted" });
    } catch (err) {
      console.error("Delete Section Template error:", err);
      return res.status(500).json({ message: "Unable to delete section template" });
    }
  }
}

export default FamSectionTemplateController;
