import { Request, Response, NextFunction } from "express";
import { connectDatabase } from "../config/database";

export const dbConnection = async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectDatabase();
        next();
    } catch (error) {
        console.error("Database connection failed in middleware:", error);
        next(error);
    }
};
