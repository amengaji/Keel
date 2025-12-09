import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import FamiliarisationSectionTemplate from "./FamiliarisationSectionTemplate.js";

class FamiliarisationTaskTemplate extends Model {}

FamiliarisationTaskTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Link to section template (A, B, C…)
    section_template_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "fam_section_templates",
        key: "id",
      },
    },

    // Cadet category for this task (DECK, ENGINE, ETO, CATERING, RATING)
    cadet_category: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // e.g. "A.1", "A.2", "B.3"
    task_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    // The actual description of the familiarisation task
    task_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // Order within the section
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Mark if this is mandatory for completion
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "FamiliarisationTaskTemplate",
    tableName: "fam_task_templates",
    timestamps: true,
  }
);

export default FamiliarisationTaskTemplate;
