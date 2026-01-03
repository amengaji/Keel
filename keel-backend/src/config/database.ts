//keel-backend/src/config/database.ts
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    dialect: "postgres",

        // Connection pool (CRITICAL)
    pool: {
      max: 10,        // max simultaneous connections
      min: 0,
      acquire: 30000, // wait up to 30s
      idle: 10000,    // close idle after 10s
    },

    logging: false,  // set true if you want SQL logs

  }
);

export default sequelize;
