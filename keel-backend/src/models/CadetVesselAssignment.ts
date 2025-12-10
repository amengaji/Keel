import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class CadetVesselAssignment extends Model {}

CadetVesselAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    cadet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },

    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vessels",
        key: "id",
      },
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true, // null = still on board
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "COMPLETED", "CANCELLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CadetVesselAssignment",
    tableName: "cadet_vessel_assignments",
    timestamps: true,
  }
);

export default CadetVesselAssignment;
