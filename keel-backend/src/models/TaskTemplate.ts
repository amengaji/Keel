import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import ShipType from "./ShipType.js";

class TaskTemplate extends Model {
  declare id: number;
  declare part_number: number;
  declare section_name: string | null;
  declare title: string;
  declare description: string | null;
  declare stcw_reference: string | null;
  declare mandatory_for_all: boolean;
  declare ship_type_id: number | null; // NULL = Universal
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaskTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    part_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1=General, 2=Specific, etc.",
    },
    section_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Grouping like 'Navigation', 'Safety'",
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stcw_reference: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "e.g. A-II/1",
    },
    mandatory_for_all: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "ship_types",
        key: "id",
      },
      comment: "NULL implies the task applies to ALL ships",
    },
  },
  {
    sequelize,
    modelName: "TaskTemplate",
    tableName: "task_templates",
    timestamps: true,
    indexes: [
      // Prevent duplicate tasks for the same ship type context
      {
        unique: true,
        fields: ["title", "ship_type_id"], 
        name: "unique_task_title_per_type",
      },
    ],
  }
);

export default TaskTemplate;