import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import Role from "./Role.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    full_name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles",
        key: "id",
      },
    },

    // NEW: current vessel for this user (cadet/officer/etc.)
    current_vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "vessels",
        key: "id",
      },
    },

    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

export default User;
