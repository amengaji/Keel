import { Op } from "sequelize";
import { User, Role, Vessel, CadetVesselAssignment, TaskTemplate } from "../../models/index.js";

export async function fetchDashboardStats() {
  console.log("📊 DASHBOARD: Starting stats fetch...");

  try {
    // 1. Active Vessels
    const activeVesselsCount = await Vessel.count({
      where: { is_active: true }
    });
    console.log("📊 Stats: Active Vessels =", activeVesselsCount);

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
    console.log("📊 Stats: Total Cadets =", totalCadetsCount);

    // 3. Cadets Onboard (Active Assignment)
    // FIX: Changed from { active: true } to { status: "ACTIVE" }
    const cadetsOnboardCount = await CadetVesselAssignment.count({
      where: { status: "ACTIVE" } 
    });
    console.log("📊 Stats: Cadets Onboard =", cadetsOnboardCount);

    // 4. Total Tasks Defined (Templates)
    const totalTasksCount = await TaskTemplate.count();
    console.log("📊 Stats: Total Tasks =", totalTasksCount);

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
      signatures: {
        pending: 0,
        ready_to_lock: 0,
      }
    };
  } catch (err) {
    console.error("❌ DASHBOARD SERVICE CRASHED:", err);
    throw err;
  }
}
