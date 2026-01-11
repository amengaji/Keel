// keel-backend/src/models/associations.ts
import User from "./User.js";
import Role from "./Role.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";
import TaskTemplate from "./TaskTemplate.js";

export const setupAssociations = () => {
  // --- User & Role ---
  User.belongsTo(Role, { foreignKey: "role_id"});
  Role.hasMany(User, { foreignKey: "role_id" });

  // --- Vessel & ShipType ---
  Vessel.belongsTo(ShipType, { foreignKey: "ship_type_id"});
  ShipType.hasMany(Vessel, { foreignKey: "ship_type_id" });

  // --- Cadet Assignments ---
  CadetVesselAssignment.belongsTo(User, { foreignKey: "cadet_id", as: "cadet" });
  CadetVesselAssignment.belongsTo(Vessel, { foreignKey: "vessel_id", as: "vessel" });
  User.hasMany(CadetVesselAssignment, { foreignKey: "cadet_id" });
  Vessel.hasMany(CadetVesselAssignment, { foreignKey: "vessel_id" });

  // --- Tasks ---
  TaskTemplate.belongsTo(ShipType, { foreignKey: "ship_type_id"});
  ShipType.hasMany(TaskTemplate, { foreignKey: "ship_type_id" });

  console.log("🛠️  Associations initialized.");
};