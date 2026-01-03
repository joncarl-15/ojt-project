import { authenticate } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/constants";
import { UserModel } from "../models/userModel";
import { TokenPayload } from "./interface";

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare passwords
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate JWT tokens
 */
export async function generateTokens(
  payload: TokenPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const jwtSecret = config.JWT.SECRET;

  // Using type assertion to handle JWT library type issues
  const accessToken = (jwt.sign as any)(payload, jwtSecret, {
    expiresIn: config.JWT.EXPIRES_IN,
  }) as string;

  const refreshToken = (jwt.sign as any)(payload, jwtSecret, {
    expiresIn: config.JWT.REFRESH_EXPIRES_IN,
  }) as string;

  return { accessToken, refreshToken };
}

/**
 * Remove sensitive data from user object
 */
export async function sanitizeUser(user: UserModel): Promise<Omit<UserModel, "password">> {
  const { password, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
}

/**
 * Helper method to apply authentication middleware
 */
export async function requireAuthentication(req: Request, res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    authenticate(req, res, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
