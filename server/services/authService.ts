import jwt from "jsonwebtoken";
import { config } from "../config/constants";
import { AuthResponse, LoginCredentials, RegisterData, TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { UserModel } from "../models/userModel";
import { UserRepository } from "../repositories/userRepository";
import { hashPassword, generateTokens, sanitizeUser, comparePasswords } from "../helpers/auth";

// Purpose: This service class is responsible for handling authentication-related business logic including user registration, login, token generation, and password management.
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(registerData: RegisterData): Promise<AuthResponse> {
    const { firstName, lastName, middleName, email, password, role, program, userName } =
      registerData;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !userName) {
      throw new AppError("Name, email, role, userName, and password are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.searchUser({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await this.userRepository.createUser({
      userName,
      firstName,
      lastName,
      middleName,
      role,
      program,
      email,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: newUser._id.toString(),
      email: newUser.email,
      firstName: newUser.firstName,
      role: newUser.role,
      program: newUser.program,
    });

    // Auto-add to program group
    if (newUser.program && newUser.role === 'student') {
      try {
        const { ConversationService } = await import("./conversationService");
        const conversationService = new ConversationService();
        // Ensure group exists
        let group = await conversationService.getProgramGroup(newUser.program as "bsit" | "bsba");
        if (!group) {
          const groupName = newUser.program.toUpperCase() + " Group Chat";
          group = await conversationService.createProgramGroup(newUser.program as "bsit" | "bsba", newUser._id, groupName);
        } else {
          await conversationService.addUserToGroup(group._id, newUser._id);
        }
      } catch (error) {
        console.error("Failed to add user to program group:", error);
      }
    }

    // Remove password from response
    const userResponse = await sanitizeUser(newUser);

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { userName, password, role } = credentials;

    // Basic validation
    if (!userName || !password || !role) {
      throw new AppError("userName, role and password are required", 400);
    }

    // Find user
    const user = await this.userRepository.searchAndUpdate({ userName: userName });
    if (!user) {
      throw new AppError("Invalid userName or password", 401);
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify role matches
    if (!["admin", "student", "coordinator"].includes(user.role)) {
      throw new Error("Invalid role for this user");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      program: user.program,
    });

    // Remove password from response
    const userResponse = await sanitizeUser(user);

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(token, config.JWT.SECRET) as TokenPayload;

      // Verify user still exists
      const user = await this.userRepository.getUser(decoded.id);
      if (!user) {
        throw new AppError("User no longer exists", 401);
      }

      // Generate new tokens
      const tokens = await generateTokens({
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        role: user.role,
        program: user.program,
      });

      return tokens;
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.JWT.SECRET) as TokenPayload;

      // Verify user still exists
      const user = await this.userRepository.getUser(decoded.id);
      if (!user) {
        throw new AppError("User no longer exists", 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid token", 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Token expired", 401);
      }
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isValidPassword = await comparePasswords(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.userRepository.updateUser(userId, { password: hashedPassword });
  }

  /**
   * Get user profile by token
   */
  async getProfile(userId: string): Promise<Omit<UserModel, "password">> {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return await sanitizeUser(user);
  }
}
