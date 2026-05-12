import mongoose from "mongoose";
import { logger } from "@nfe/config";

export const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/emailverify";
    await mongoose.connect(mongoUri);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");
    process.exit(1);
  }
};

export const getConnection = () => mongoose.connection;
