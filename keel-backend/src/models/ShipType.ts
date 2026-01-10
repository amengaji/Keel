import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ShipType extends Model {
  declare id: number;
  declare type_code: string;
  declare name: string;
  declare description: string | null;
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ShipType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: "ShipType",
    tableName: "ship_types",
    timestamps: true,
  }
);

export default ShipType;
