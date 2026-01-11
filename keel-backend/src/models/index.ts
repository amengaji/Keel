// keel-backend/src/models/index.ts
import sequelize from "../config/database.js";
import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "./CadetFamiliarisationState.js";
import TaskTemplate from "./TaskTemplate.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";


// Setup associations immediately before exporting
import { setupAssociations } from "./associations.js";
setupAssociations();


// Export everything
export {
  sequelize,
  Role,
  User,
  ShipType,
  Vessel,
  FamiliarisationSectionTemplate,
  FamiliarisationTaskTemplate,
  CadetFamiliarisationState,
  TaskTemplate,
  CadetVesselAssignment
};