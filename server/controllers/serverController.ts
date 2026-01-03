import { Request, Response, NextFunction } from "express";
import { config } from "../config/constants";
import { route } from "express-extract-routes";
import mongoose from "mongoose";

// Purpose: This controller class is responsible for handling the server related requests.
export class ServerController {
  @route.get("/")
  getServer = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
      res.json({
        message: config.MESSAGE.WELCOME,
        database_status: dbStatus
      });
    } catch (error) {
      next(error);
    }
  };
}
