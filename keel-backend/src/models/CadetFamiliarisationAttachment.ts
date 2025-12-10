//keel-backend/src/models/CadetFamiliarisationAttachment.ts
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class CadetFamiliarisationAttachment extends Model {}

CadetFamiliarisationAttachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cadet_familiarisation_state",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "cadet_familiarisation_attachments",
    modelName: "CadetFamiliarisationAttachment",
    timestamps: true,
  }
);

export default CadetFamiliarisationAttachment;
