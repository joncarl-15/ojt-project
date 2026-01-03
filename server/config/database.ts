import mongoose, { Mongoose } from "mongoose";
import { logger } from "../helpers/logger";
import { config } from "./constants";

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Caches the connection to avoid multiple connections.
 */

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const cached: MongooseConnection = {
  conn: null,
  promise: null,
};

export const connectDatabase = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGO_URI || config.DB.URI;

    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongoose: Mongoose) => {
        logger.info(config.DB.CONNECTED);
        return mongoose;
      })
      .catch((error: Error) => {
        logger.error(config.DB.ERROR, error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};
