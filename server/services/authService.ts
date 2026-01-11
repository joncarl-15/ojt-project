import jwt from "jsonwebtoken";
import { config } from "../config/constants";
import { AuthResponse, LoginCredentials, RegisterData, TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { UserModel } from "../models/userModel";
import { UserRepository } from "../repositories/userRepository";
import { EmailService } from "./emailService";
import { hashPassword, generateTokens, sanitizeUser, comparePasswords } from "../helpers/auth";

// Purpose: This service class is responsible for handling authentication-related business logic including user registration, login, token generation, and password management.
export class AuthService {
  private userRepository: UserRepository;
  private emailService: EmailService;
  // Use a simple in-memory store for OTPs for this MVP. In production, use Redis.
  // Key: email, Value: { code: string, expires: number }
  private static otpStore: Map<string, { code: string; expires: number }> = new Map();

  constructor() {
    this.userRepository = new UserRepository();
    this.emailService = new EmailService();
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
      lastName: newUser.lastName,
      role: newUser.role,
      program: newUser.program,
    });

    // Auto-add to program group
    if (newUser.program && (newUser.role === 'student' || newUser.role === 'coordinator')) {
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
    const user = await this.userRepository.searchUser({ userName: userName }) as UserModel | null;
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
      lastName: user.lastName,
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
        lastName: user.lastName,
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

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.searchUser({ email });
    if (!user) {
      throw new AppError("User with this email does not exist", 404);
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with 10 min expiration
    AuthService.otpStore.set(email.toLowerCase(), {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });
    // console.log(`Debug: OTP stored for ${email.toLowerCase()}: ${code}`);

    await this.emailService.sendPasswordResetCode(email, code);
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const storedOtp = AuthService.otpStore.get(normalizedEmail);

    // console.log(`Debug: Verifying OTP for ${normalizedEmail}. Input Code: ${code}. Stored:`, storedOtp);
    // console.log(`Debug: Current Store Keys:`, [...AuthService.otpStore.keys()]);

    if (!storedOtp) return false;

    if (Date.now() > storedOtp.expires) {
      AuthService.otpStore.delete(normalizedEmail);
      return false;
    }

    if (storedOtp.code !== code) return false;

    return true;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const isValid = await this.verifyResetCode(email, code);
    if (!isValid) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    const user = await this.userRepository.searchUser({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const hashedPassword = await hashPassword(newPassword);
    // Ensure user is not an array (though searchUser returns single object with default options, type definition might be ambiguous)
    const userToUpdate = Array.isArray(user) ? user[0] : user;
    await this.userRepository.updateUser(userToUpdate._id, { password: hashedPassword });

    // Clear OTP
    AuthService.otpStore.delete(email.toLowerCase());
  }

  /**
   * Request email change (Admin only)
   */
  async requestEmailChange(userId: string, currentPassword: string, newEmail: string): Promise<void> {
    const user = await this.userRepository.getUser(userId);
    if (!user || user.role !== 'admin') {
      throw new AppError("Unauthorized or user not found", 403);
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", 401);
    }

    // Check if new email is already taken
    const existingUser = await this.userRepository.searchUser({ email: newEmail });
    if (existingUser) {
      throw new AppError("Email is already in use", 400);
    }

    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP for the NEW email (as key) but we also need to know who requested it...
    // Or stick to userID? But `verifyEmailChange` takes newEmail and code.
    // Let's store by userId to be safe, or composite key?
    // Actually, storing by userId is safer to prevent conflict if multiple admins try to switch to same email (edge case).
    // Key: `email_change_${userId}`

    AuthService.otpStore.set(`email_change_${userId}`, {
      code,
      expires: Date.now() + 10 * 60 * 1000
    });

    // Send code to NEW email so we verify they have access to it
    await this.emailService.sendEmailChangeVerificationCode(newEmail, code);
  }

  /**
   * Verify and update email
   */
  async verifyEmailChange(userId: string, newEmail: string, code: string): Promise<void> {
    const key = `email_change_${userId}`;
    const storedOtp = AuthService.otpStore.get(key);

    if (!storedOtp) {
      throw new AppError("No pending email change request or request expired", 400);
    }

    if (Date.now() > storedOtp.expires) {
      AuthService.otpStore.delete(key);
      throw new AppError("Verification code expired", 400);
    }

    if (storedOtp.code !== code) {
      throw new AppError("Invalid verification code", 400);
    }

    // Update email
    await this.userRepository.updateUser(userId, { email: newEmail });

    // Clear OTP
    AuthService.otpStore.delete(key);
  }
}
