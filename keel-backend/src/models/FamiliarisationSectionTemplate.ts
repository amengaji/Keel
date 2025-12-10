//keel-backend/src/models/FamiliarisationSectionTemplate.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class FamiliarisationSectionTemplate extends Model {}

FamiliarisationSectionTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Which ship type this section belongs to (OIL, BULK, LNG, etc.)
    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ship_types",
        key: "id",
      },
    },

    // Which cadet category this section is for
    // DECK | ENGINE | ETO | CATERING | RATING
    cadet_category: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // Section code like A, B, C, D, E, F
    section_code: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },

    // Section title, e.g. "Safety Familiarisation"
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    // For ordering in UI (1, 2, 3…)
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
