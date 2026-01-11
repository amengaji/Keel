// keel-backend/src/models/FamiliarisationSectionTemplate.ts

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

/* ======================================================================
 * Attribute Types
 * ====================================================================== */

export interface FamiliarisationSectionTemplateAttributes {
  id: number;
  ship_type_id: number;
  cadet_category: string;
  section_code: string;
  title: string;
  order_number: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/* ======================================================================
 * Creation Attributes
 * ====================================================================== */

type FamiliarisationSectionTemplateCreationAttributes =
  Optional<FamiliarisationSectionTemplateAttributes, "id">;

/* ======================================================================
 * Model Class
 * ====================================================================== */

class FamiliarisationSectionTemplate
  extends Model<
    FamiliarisationSectionTemplateAttributes,
    FamiliarisationSectionTemplateCreationAttributes
  >
  implements FamiliarisationSectionTemplateAttributes
{
  declare id: number;
  declare ship_type_id: number;
  declare cadet_category: string;
  declare section_code: string;
  declare title: string;
  declare order_number: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/* ======================================================================
 * Init
 * ====================================================================== */

FamiliarisationSectionTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ship_types",
        key: "id",
      },
    },

    cadet_category: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    section_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "FamiliarisationSectionTemplate",
    tableName: "fam_section_templates",
    timestamps: true,
  }
);

export default FamiliarisationSectionTemplate;
