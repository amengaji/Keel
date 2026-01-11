import { Op } from "sequelize";
import { User, Role, Vessel, CadetVesselAssignment, TaskTemplate } from "../../models/index.js";

export async function fetchDashboardStats() {
  // 1. Active Vessels
  const activeVesselsCount = await Vessel.count({
    where: { is_active: true }
  });

  // 2. Total Cadets (Registered)
  const totalCadetsCount = await User.count({
    include: [
      {
        model: Role,
        as: "role",
        where: { role_name: "CADET" },
      },
    ],
  });

  // 3. Cadets Onboard (Active Assignment)
  const cadetsOnboardCount = await CadetVesselAssignment.count({
    where: { status: "ACTIVE" }
  });

  // 4. Total Tasks Defined (Templates)
  // This helps confirm Task Imports worked
  const totalTasksCount = await TaskTemplate.count();

  return {
    vessels: {
      active: activeVesselsCount,
    },
    cadets: {
      total: totalCadetsCount,
      onboard: cadetsOnboardCount,
      shore: Math.max(0, totalCadetsCount - cadetsOnboardCount),
    },
    tasks: {
      total_templates: totalTasksCount,
    },
    // Placeholders for Phase 4 (Signatures)
    signatures: {
      pending: 0,
      ready_to_lock: 0,
    }
  };
}