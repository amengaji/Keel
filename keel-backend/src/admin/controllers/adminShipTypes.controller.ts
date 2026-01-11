// keel-backend/src/admin/controllers/adminShipTypes.controller.ts
import { Request, Response } from "express";
import {
  fetchAdminShipTypes,
  createShipType,
  updateShipType,
  deleteShipType,
} from "../services/adminShipTypes.service.js";

// GET
export async function getAdminShipTypes(req: Request, res: Response) {
  try {
    const data = await fetchAdminShipTypes();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch ship types" });
  }
}

// POST (Create)
export async function createShipTypeController(req: Request, res: Response) {
  try {
    const { name, type_code, description } = req.body;
    if (!name || !type_code) {
      return res.status(400).json({ success: false, message: "Name and Code are required" });
    }
    
    const result = await createShipType({ name, type_code, description });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// PUT (Update)
export async function updateShipTypeController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const result = await updateShipType(id, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE
export async function deleteShipTypeController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deleteShipType(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
}