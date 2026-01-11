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
  public department!: string;
  public trainee_type!: string; // <--- NEW FIELD
  
  public instructions!: string;
  public safety_requirements!: string;
  public evidence_type!: string;
  public verification_method!: string;
  public frequency!: string;
}

TaskTemplate.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    part_number: { type: DataTypes.INTEGER, allowNull: false },
    section_name: { type: DataTypes.STRING(200), allowNull: true },
    title: { type: DataTypes.STRING(500), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    stcw_reference: { type: DataTypes.STRING(200), allowNull: true },
    mandatory_for_all: { type: DataTypes.BOOLEAN, defaultValue: false },
    ship_type_id: { type: DataTypes.INTEGER, allowNull: true },
    department: { type: DataTypes.STRING(50), defaultValue: "General" },
    trainee_type: { type: DataTypes.STRING(50), defaultValue: "All" }, // <--- NEW COLUMN
    
    instructions: { type: DataTypes.TEXT, allowNull: true },
    safety_requirements: { type: DataTypes.TEXT, allowNull: true },
    evidence_type: { type: DataTypes.STRING(50), defaultValue: "NONE" },
    verification_method: { type: DataTypes.STRING(50), defaultValue: "OBSERVATION" },
    frequency: { type: DataTypes.STRING(50), defaultValue: "ONCE" },
  },
  {
    sequelize,
    tableName: "task_templates",
  }
);

export default TaskTemplate;
