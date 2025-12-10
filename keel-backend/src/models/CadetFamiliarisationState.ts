//keel-backend/src/models/CadetFamiliarisationState.ts
import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import sequelize from "../config/database.js";

class CadetFamiliarisationState extends Model<
  InferAttributes<CadetFamiliarisationState>,
  InferCreationAttributes<CadetFamiliarisationState>
> {
  declare id: CreationOptional<number>;
  declare cadet_id: number;
  declare vessel_id: number;
  declare section_id: number;
  declare task_id: number;

  declare status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "CTO_APPROVED"
    | "MASTER_APPROVED"
    | "REJECTED";

  declare cadet_comment: string | null;
  declare submitted_at: Date | null;
  declare cto_signed_at: Date | null;
  declare master_signed_at: Date | null;
  declare rejection_comment: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}


CadetFamiliarisationState.init(
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
      onDelete: "CASCADE",
    },

    vessel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "vessels",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    section_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "fam_section_templates",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "fam_task_templates",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM(
        "NOT_STARTED",
        "IN_PROGRESS",
        "SUBMITTED",
        "CTO_APPROVED",
        "MASTER_APPROVED",
        "REJECTED"
      ),
      defaultValue: "NOT_STARTED",
    },

    cadet_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    cto_signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    master_signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    rejection_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    /** ⭐ REQUIRED FOR TYPESCRIPT */
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CadetFamiliarisationState",
    tableName: "cadet_familiarisation_state",
    timestamps: true,
  }
);


export default CadetFamiliarisationState;
