import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";

// ------------ Role → User ------------
Role.hasMany(User, {
  foreignKey: "role_id",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "role_id",
  as: "role",
});

// ------------ ShipType → Vessel ------------
ShipType.hasMany(Vessel, {
  foreignKey: "ship_type_id",
  as: "vessels",
});

Vessel.belongsTo(ShipType, {
  foreignKey: "ship_type_id",
  as: "shipType",
});

// ------------ ShipType → FamiliarisationSectionTemplate ------------
ShipType.hasMany(FamiliarisationSectionTemplate, {
  foreignKey: "ship_type_id",
  as: "familiarisationSections",
});

FamiliarisationSectionTemplate.belongsTo(ShipType, {
  foreignKey: "ship_type_id",
  as: "shipType",
});

// ------------ FamiliarisationSectionTemplate → FamiliarisationTaskTemplate ------------
FamiliarisationSectionTemplate.hasMany(FamiliarisationTaskTemplate, {
  foreignKey: "section_template_id",
  as: "tasks",
});

FamiliarisationTaskTemplate.belongsTo(FamiliarisationSectionTemplate, {
  foreignKey: "section_template_id",
  as: "sectionTemplate",
});
