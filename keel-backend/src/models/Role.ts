import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Role extends Model {
  declare id: number;
  declare role_name: string;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Role",
    tableName: "roles",
    timestamps: false,
  }
);

export default Role;
