import mongoose from "mongoose";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const dbConnection = async () => {
  try {
    await mongoose.connect(env.DB_URL, {
      dbName: env.DB_NAME,
    });
    logger.info("MongoDB connected successfully.", {
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  } catch (error) {
    logger.error("Failed to connect to MongoDB.", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

export default dbConnection;
