// keel-backend/src/models/associations.ts

import User from "./User.js";
import Role from "./Role.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";
import TaskTemplate from "./TaskTemplate.js";

/* ------------------------------------------------------------------ */
/* Prevent double-initialization                                       */
/* ------------------------------------------------------------------ */

let associationsInitialized = false;

export const setupAssociations = () => {
  if (associationsInitialized) {
    console.warn("⚠️ Associations already initialized. Skipping.");
    return;
  }

  /* ================================================================ */
  /* 1. User <-> Role                                                 */
  /* ================================================================ */

  User.belongsTo(Role, {
    foreignKey: "role_id",
    as: "role",              // 👈 explicit, safe
  });

  Role.hasMany(User, {
    foreignKey: "role_id",
    as: "users",             // 👈 different alias
  });

  /* ================================================================ */
  /* 2. Vessel <-> ShipType                                           */
  /* ================================================================ */

  Vessel.belongsTo(ShipType, {
    foreignKey: "ship_type_id",
    as: "shipType",
  });

  ShipType.hasMany(Vessel, {
    foreignKey: "ship_type_id",
    as: "vessels",
  });

  /* ================================================================ */
  /* 3. Cadet Vessel Assignments                                      */
  /* ================================================================ */

  CadetVesselAssignment.belongsTo(User, {
    foreignKey: "cadet_id",
    as: "cadet",
  });

  CadetVesselAssignment.belongsTo(Vessel, {
    foreignKey: "vessel_id",
    as: "vessel",
  });

  User.hasMany(CadetVesselAssignment, {
    foreignKey: "cadet_id",
    as: "vesselAssignments",
  });

  Vessel.hasMany(CadetVesselAssignment, {
    foreignKey: "vessel_id",
    as: "cadetAssignments",
  });

  /* ================================================================ */
  /* 4. Task Templates <-> ShipType                                   */
  /* ================================================================ */

  TaskTemplate.belongsTo(ShipType, {
    foreignKey: "ship_type_id",
    as: "shipType",
  });

  ShipType.hasMany(TaskTemplate, {
    foreignKey: "ship_type_id",
    as: "taskTemplates",
  });

  /* ================================================================ */

  associationsInitialized = true;
  console.log("🛠️ Associations initialized safely.");
};
