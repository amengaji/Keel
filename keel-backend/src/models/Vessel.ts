// keel-backend/src/models/Vessel.ts
//
// PURPOSE:
// - Sequelize model for vessels (core ship registry)
// - Supports SOFT DELETE using is_active flag
// - IMO number is immutable after creation (enforced in service layer)
// - Designed for audit-safe admin operations
//

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

class Vessel extends Model {}

Vessel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    /* ------------------------------------------------------------------
     * CORE IDENTIFICATION
     * ------------------------------------------------------------------ */

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      comment: "Registered vessel name",
    },

    imo_number: {
      type: DataTypes.STRING(10), // string to preserve leading zeros
      allowNull: false,
      unique: true,
      comment: "IMO number (unique, immutable after creation)",
    },

    call_sign: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    mmsi: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * FLAG & REGISTRY
     * ------------------------------------------------------------------ */

    flag: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    port_of_registry: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * SHIP TYPE (SYSTEM TAXONOMY — READ ONLY)
     * ------------------------------------------------------------------ */

    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ship_types",
        key: "id",
      },
      comment: "FK to ship_types (system taxonomy)",
    },

    /* ------------------------------------------------------------------
     * CLASSIFICATION & BUILD
     * ------------------------------------------------------------------ */

    classification_society: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    builder: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    year_built: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * TONNAGE & DIMENSIONS
     * ------------------------------------------------------------------ */

    gross_tonnage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    net_tonnage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    deadweight_tonnage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    length_overall_m: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    breadth_moulded_m: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    depth_m: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    draught_summer_m: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * MACHINERY
     * ------------------------------------------------------------------ */

    main_engine_type: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    main_engine_model: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    main_engine_power_kw: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    aux_engine_details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    service_speed_knots: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * OWNERSHIP / MANAGEMENT
     * ------------------------------------------------------------------ */

    owner_company: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    manager_company: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    operating_area: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * SPECIAL / CLASS INFORMATION
     * ------------------------------------------------------------------ */

    ice_class: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * DRY DOCKING / SURVEY DATES
     * ------------------------------------------------------------------ */

    last_drydock_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    next_drydock_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    last_special_survey_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    next_special_survey_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    /* ------------------------------------------------------------------
     * SOFT DELETE FLAG (AUDIT SAFE)
     * ------------------------------------------------------------------ */

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Soft delete flag: true = active, false = deleted",
    },
  },
  {
    sequelize,
    modelName: "Vessel",
    tableName: "vessels",
    timestamps: true,

    // IMPORTANT:
    // - We are NOT using Sequelize paranoid deletes
    // - Soft delete is handled explicitly via is_active
    // - This avoids accidental hard deletes and preserves audit safety
  }
);

export default Vessel;
