// keel-backend/src/admin/services/adminShipTypes.service.ts
import { Op } from "sequelize";
import ShipType from "../../models/ShipType.js";
import Vessel from "../../models/Vessel.js";

/* ======================================================================
 * READ
 * ====================================================================== */
export async function fetchAdminShipTypes() {
  try {
    const types = await ShipType.findAll({
      order: [["name", "ASC"]],
    });
    return types;
  } catch (error) {
    console.error("Error fetching ship types:", error);
    throw error;
  }
}

/* ======================================================================
 * CREATE
 * ====================================================================== */
export async function createShipType(data: { name: string; type_code: string; description?: string }) {
  const existing = await ShipType.findOne({
    where: {
      [Op.or]: [{ name: data.name }, { type_code: data.type_code }],
    },
  });

  if (existing) {
    throw new Error("Ship Type with this Name or Code already exists");
  }

  return await ShipType.create(data);
}

/* ======================================================================
 * UPDATE
 * ====================================================================== */
export async function updateShipType(id: number, data: { name?: string; type_code?: string; description?: string }) {
  const shipType = await ShipType.findByPk(id);

  if (!shipType) {
    throw new Error("Ship Type not found");
  }

  // Check for duplicates if changing name/code
  if (data.name || data.type_code) {
    const existing = await ShipType.findOne({
      where: {
        [Op.and]: [
          { [Op.not]: { id } }, // Exclude self
          {
            [Op.or]: [
              ...(data.name ? [{ name: data.name }] : []),
              ...(data.type_code ? [{ type_code: data.type_code }] : []),
            ],
          },
        ],
      },
    });

    if (existing) {
      throw new Error("Another Ship Type with this Name or Code already exists");
    }
  }

  return await shipType.update(data);
}

/* ======================================================================
 * DELETE
 * ====================================================================== */
export async function deleteShipType(id: number) {
  const shipType = await ShipType.findByPk(id);

  if (!shipType) {
    throw new Error("Ship Type not found");
  }

  // Integrity Check: Is it used by any vessels?
  const usedCount = await Vessel.count({ where: { ship_type_id: id } });
  if (usedCount > 0) {
    throw new Error(`Cannot delete: This Ship Type is assigned to ${usedCount} vessels.`);
  }

  await shipType.destroy();
  return { success: true };
}