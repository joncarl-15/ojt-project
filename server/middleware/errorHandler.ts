import { Request, Response, NextFunction } from "express";
import { logger } from "../helpers/logger";

// Purpose: Custom error handler middleware
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      status: "error",
      message: this.message,
      statusCode: this.statusCode,
      stack:
        process.env.NODE_ENV === "production"
          ? "🚫"
          : this.stack?.split("\n").map((msg) => msg.trim()),
    };
  }
}

// Not found route handler
export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError("Not found", 404);
  next(error);
};

// Error handler middleware
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
  } else {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
