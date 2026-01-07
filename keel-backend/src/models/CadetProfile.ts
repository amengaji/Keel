// keel-backend/src/models/CadetProfile.ts
//
// PURPOSE:
// - Maritime identity & statutory data for Cadets
// - One-to-one with users
// - Audit-grade separation from auth & assignments
//

import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../config/database.js";

class CadetProfile extends Model<
  InferAttributes<CadetProfile>,
  InferCreationAttributes<CadetProfile>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;

  // Personal
  declare date_of_birth: Date;
  declare gender: string | null;
  declare nationality: string;

  // Contact
  declare phone_number: string | null;
  declare emergency_contact_name: string | null;
  declare emergency_contact_phone: string | null;

  declare address_line_1: string | null;
  declare address_line_2: string | null;
  declare city: string | null;
  declare state: string | null;
  declare country: string | null;
  declare postal_code: string | null;

  // Maritime Identity
  declare passport_number: string;
  declare passport_expiry_date: Date | null;

  declare seaman_book_number: string;
  declare seaman_book_expiry_date: Date | null;

  declare indos_number: string | null;
  declare indos_expiry_date: Date | null;

  // Training Metadata
  declare trainee_type: string;
  declare rank_label: string;
  declare category: string;
  declare trb_applicable: boolean;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

CadetProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    gender: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    nationality: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },

    phone_number: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    emergency_contact_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    emergency_contact_phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    address_line_1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    address_line_2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    passport_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    passport_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    seaman_book_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    seaman_book_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    indos_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },

    indos_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    trainee_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    rank_label: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    trb_applicable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "cadet_profiles",
    timestamps: false,
  }
);

export default CadetProfile;
