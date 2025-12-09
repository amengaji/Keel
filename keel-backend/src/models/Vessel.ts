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

    // Core identification
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    imo_number: {
      type: DataTypes.STRING(10), // keep as string so we don't lose leading zeros
      allowNull: false,
      unique: true,
    },
    call_sign: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    mmsi: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    // Flag & registry
    flag: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    port_of_registry: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    // Link to ship type
    ship_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "ship_types",
        key: "id",
      },
    },

    // Classification & build
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

    // Tonnage & dimensions
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

    // Machinery
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

    // Ownership / management
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

    // Special / class info
    ice_class: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // Docking / survey dates
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
  },
  {
    sequelize,
    modelName: "Vessel",
    tableName: "vessels",
    timestamps: true,
  }
);

export default Vessel;
