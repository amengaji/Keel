import User from "./User.js";
import Role from "./Role.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";
import TaskTemplate from "./TaskTemplate.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";

// --- User & Role ---
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });
Role.hasMany(User, { foreignKey: "role_id" });

// --- Vessel & ShipType ---
Vessel.belongsTo(ShipType, { foreignKey: "ship_type_id", as: "shipType" });
ShipType.hasMany(Vessel, { foreignKey: "ship_type_id" });

// --- Cadet Assignments ---
CadetVesselAssignment.belongsTo(User, { foreignKey: "cadet_id", as: "cadet" });
CadetVesselAssignment.belongsTo(Vessel, { foreignKey: "vessel_id", as: "vessel" });
User.hasMany(CadetVesselAssignment, { foreignKey: "cadet_id" });
Vessel.hasMany(CadetVesselAssignment, { foreignKey: "vessel_id" });

// --- Tasks ---
// FIX: Only link ShipType for now. Section is just a string name in your DB.
TaskTemplate.belongsTo(ShipType, { foreignKey: "ship_type_id", as: "shipType" });
ShipType.hasMany(TaskTemplate, { foreignKey: "ship_type_id" });

export default {}; 
