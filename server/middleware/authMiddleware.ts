import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { AppError } from "./errorHandler";

// Purpose: This middleware is responsible for validating JWT tokens and protecting routes that require authentication.
export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Middleware to verify JWT token and authenticate requests
   * Adds user information to the request object if token is valid
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AppError("Authorization header is required", 401);
      }

      if (!authHeader.startsWith("Bearer ")) {
        throw new AppError("Authorization header must be in format: Bearer <token>", 401);
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new AppError("Token is required", 401);
      }

      // Verify token and get user payload
      const userPayload = await this.authService.verifyToken(token);

      // Attach user information to request object
      (req as any).user = userPayload;

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Optional authentication middleware
   * Adds user information if token is valid, but doesn't fail if no token is provided
   */
  optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        if (token) {
          try {
            const userPayload = await this.authService.verifyToken(token);
            (req as any).user = userPayload;
          } catch (error) {
            // Token is invalid, but we don't throw an error for optional auth
            // The user information simply won't be available
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const authenticate = authMiddleware.authenticate;
export const optionalAuthenticate = authMiddleware.optionalAuthenticate;

// Decorator for authentication
export function Authenticate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const [req, res, next] = args;
    return new Promise((resolve, reject) => {
      authMiddleware.authenticate(req, res, (err: any) => {
        if (err) {
          next(err);
          reject(err);
          return;
        }
        resolve(originalMethod.apply(this, args));
      });
    });
  };

  return descriptor;
}

// For use with the UseMiddleware decorator (fallback)
export const AuthenticateMiddleware = authMiddleware.authenticate;
