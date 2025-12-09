import { Request, Response } from "express";
import ShipType from "../models/ShipType.js";

class ShipTypeController {
  static async create(req: Request, res: Response) {
    try {
      const { type_code, name, description } = req.body;

      const shipType = await ShipType.create({ type_code, name, description });

      return res.status(201).json(shipType);
    } catch (err) {
      console.error("Create Ship Type error:", err);
      return res.status(500).json({ message: "Unable to create ship type" });
    }
  }

  static async getAll(req: Request, res: Response) {
    const data = await ShipType.findAll();
    return res.json(data);
  }

  static async update(id: any, req: Request, res: Response) {
    return res.json({ message: "Not implemented here" });
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await ShipType.destroy({ where: { id } });

      if (!deleted) {
        return res.status(404).json({ message: "Ship type not found" });
      }

      return res.json({ message: "Deleted" });
    } catch (err) {
      console.error("Delete Ship Type error:", err);
      return res.status(500).json({ message: "Unable to delete ship type" });
    }
  }
}

export default ShipTypeController;
