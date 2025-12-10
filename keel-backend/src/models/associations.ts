//keel-backend/src/models/associations.ts
import Role from "./Role.js";
import User from "./User.js";
import ShipType from "./ShipType.js";
import Vessel from "./Vessel.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";
import FamiliarisationTaskTemplate from "./FamiliarisationTaskTemplate.js";
import CadetVesselAssignment from "./CadetVesselAssignment.js";
import CadetFamiliarisationState from "./CadetFamiliarisationState.js";
import CadetFamiliarisationAttachment from "./CadetFamiliarisationAttachment.js";

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

// User's current vessel (simple pointer)
User.belongsTo(Vessel, {
  foreignKey: "current_vessel_id",
  as: "current_vessel",
});

Vessel.hasMany(User, {
  foreignKey: "current_vessel_id",
  as: "crew_members",
});

// Cadet vessel assignment history
User.hasMany(CadetVesselAssignment, {
  foreignKey: "cadet_id",
  as: "vessel_assignments",
});

CadetVesselAssignment.belongsTo(User, {
  foreignKey: "cadet_id",
  as: "cadet",
});

Vessel.hasMany(CadetVesselAssignment, {
  foreignKey: "vessel_id",
  as: "cadet_assignments",
});

CadetVesselAssignment.belongsTo(Vessel, {
  foreignKey: "vessel_id",
  as: "vessel",
});

// Familiarisation state relations
User.hasMany(CadetFamiliarisationState, {
  foreignKey: "cadet_id",
  as: "familiarisation_states",
});
CadetFamiliarisationState.belongsTo(User, {
  foreignKey: "cadet_id",
  as: "cadet",
});

Vessel.hasMany(CadetFamiliarisationState, {
  foreignKey: "vessel_id",
  as: "familiarisation_states",
});
CadetFamiliarisationState.belongsTo(Vessel, {
  foreignKey: "vessel_id",
  as: "vessel",
});

FamiliarisationSectionTemplate.hasMany(CadetFamiliarisationState, {
  foreignKey: "section_id",
  as: "familiarisation_states",
});
CadetFamiliarisationState.belongsTo(FamiliarisationSectionTemplate, {
  foreignKey: "section_id",
  as: "section",
});

FamiliarisationTaskTemplate.hasMany(CadetFamiliarisationState, {
  foreignKey: "task_id",
  as: "familiarisation_states",
});
CadetFamiliarisationState.belongsTo(FamiliarisationTaskTemplate, {
  foreignKey: "task_id",
  as: "task",
});

CadetFamiliarisationState.hasMany(CadetFamiliarisationAttachment, {
  foreignKey: "state_id",
  as: "attachments",
});

CadetFamiliarisationAttachment.belongsTo(CadetFamiliarisationState, {
  foreignKey: "state_id",
  as: "state",
});