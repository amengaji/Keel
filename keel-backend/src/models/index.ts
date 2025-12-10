import sequelize from "../config/database.js";
import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";
import CadetFamiliarisationState from "./CadetFamiliarisationState";

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
};
