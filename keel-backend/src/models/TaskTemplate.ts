import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class TaskTemplate extends Model {
  public id!: number;
  public part_number!: number;
  public section_name!: string;
  public title!: string;
  public description!: string;
  public stcw_reference!: string;
  public mandatory_for_all!: boolean;
  public ship_type_id!: number | null;
  public department!: string; // <--- ADDED THIS
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
    },
    section_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    },
    mandatory_for_all: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    department: { // <--- ADDED THIS
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "General",
    },
  },
  {
    sequelize,
    tableName: "task_templates",
  }
);

export default TaskTemplate;
