import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class ShipType extends Model {}

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
