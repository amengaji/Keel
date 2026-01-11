import sequelize from "../config/database.js";
import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "./CadetFamiliarisationState.js";
// ADD THESE IMPORTS:
import TaskTemplate from "./TaskTemplate.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";

// Apply associations
import "./associations.js";

export {
  sequelize,
  Role,
  User,
  ShipType,
  Vessel,
  FamiliarisationSectionTemplate,
  FamiliarisationTaskTemplate,
  // EXPORT THEM HERE:
  TaskTemplate,
  CadetVesselAssignment,
  CadetFamiliarisationState,
};
