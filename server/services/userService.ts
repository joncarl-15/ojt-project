import { FilterQuery } from "mongoose";
import * as bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler";
import { UserModel } from "../models/userModel";
import { UserRepository } from "../repositories/userRepository";

// *Purpose: This service class is responsible for handling the business logic of the user entity. It interacts with the user repository to perform CRUD operations on the user entity.
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUser(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.getUser(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getUsers(): Promise<UserModel[]> {
    return this.userRepository.getUsers();
  }

  async createUser(userData: Partial<UserModel>) {
    if (!userData.firstName || !userData.lastName) {
      throw new AppError("User firstname and lastname data are required", 400);
    }

    if (!userData.email) {
      throw new AppError("Email is required", 400);
    }

    if (!userData.role) {
      throw new AppError("Invalid role. Must be admin, coordinator, or student", 400);
    }

    const existingUserByEmail = await this.userRepository.searchAndUpdate({
      email: userData.email,
    });

    if (existingUserByEmail) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password before creating user
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const createdUser = await this.userRepository.createUser(userData);

    // Auto-add to program group
    if (userData.program && userData.role === 'student') {
      try {
        const { ConversationService } = await import("./conversationService");
        const conversationService = new ConversationService();
        // Ensure group exists
        let group = await conversationService.getProgramGroup(userData.program as "bsit" | "bsba");
        if (!group) {
          // Determine group name
          const groupName = userData.program.toUpperCase() + " Group Chat";
          // Create group with this user as initial member/admin? 
          // Better to have no admin for now or system admin.
          // For now, just create it.
          group = await conversationService.createProgramGroup(userData.program as "bsit" | "bsba", createdUser._id, groupName);
        } else {
          await conversationService.addUserToGroup(group._id, createdUser._id);
        }
      } catch (error) {
        console.error("Failed to add user to program group:", error);
        // Non-blocking error
      }
    }

    return createdUser;
  }

  async updateUser(updateData: Partial<UserModel>): Promise<UserModel | null> {
    if (!updateData._id) {
      throw new AppError("User ID is required", 400);
    }

    // Hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await this.userRepository.updateUser(updateData._id, updateData);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if program was updated, if so, add to new group (optional: remove from old?)
    if (updateData.program && user.role === 'student') {
      try {
        const { ConversationService } = await import("./conversationService");
        const conversationService = new ConversationService();
        let group = await conversationService.getProgramGroup(updateData.program as "bsit" | "bsba");
        if (!group) {
          const groupName = updateData.program.toUpperCase() + " Group Chat";
          group = await conversationService.createProgramGroup(updateData.program as "bsit" | "bsba", user._id, groupName);
        } else {
          await conversationService.addUserToGroup(group._id, user._id);
        }
      } catch (error) {
        console.error("Failed to update user program group:", error);
      }
    }

    return user;
  }

  async deleteUser(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.deleteUser(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async searchUser(
    query: FilterQuery<UserModel>,
    options?: { multiple?: boolean }
  ): Promise<UserModel | UserModel[]> {
    // Fields that require exact matching (not regex)
    const exactMatchFields = ["role", "program", "email"];

    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        // Use exact match for specific fields, case-insensitive regex for text search fields
        if (exactMatchFields.includes(key)) {
          acc[key] = value;
          console.log(`Exact match for ${key}:`, value);
        } else {
          acc[key] = { $regex: new RegExp(value, "i") };
          console.log(`Regex match for ${key}:`, value);
        }
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<UserModel>);

    console.log("Final MongoDB query:", JSON.stringify(caseInsensitiveQuery));

    const { multiple = false } = options || {};

    if (multiple) {
      const users = await this.userRepository.searchUser(caseInsensitiveQuery, {
        multiple: true,
        populate: true,
      });
      if (!users || (Array.isArray(users) && users.length === 0)) {
        throw new AppError("No users found", 404);
      }
      return users as UserModel[];
    } else {
      const user = await this.userRepository.searchUser(caseInsensitiveQuery);
      if (!user || Array.isArray(user)) {
        throw new AppError("User not found", 404);
      }
      return user;
    }
  }

  async assignUserToCompany(
    userId: string,
    companyId: string,
    coordinatorId: string,
    deploymentDate?: Date,
    status?: "scheduled" | "deployed" | "completed"
  ): Promise<UserModel | null> {
    // Check if user exists
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is a student
    if (user.role !== "student") {
      throw new AppError("Only students can be assigned to companies", 400);
    }

    // Check if user is already assigned to a company
    if (user.metadata?.company) {
      throw new AppError("User is already assigned to a company", 400);
    }

    // Update user with company assignment
    const updateData: Partial<UserModel> = {
      metadata: {
        ...user.metadata,
        company: companyId as any,
        coordinator: coordinatorId as any,
        deploymentDate: deploymentDate || new Date(),
        status: status || "scheduled",
      },
    };

    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new AppError("Failed to assign user to company", 500);
    }

    return updatedUser;
  }

  async unassignUserFromCompany(userId: string): Promise<UserModel | null> {
    // Check if user exists
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is a student
    if (user.role !== "student") {
      throw new AppError("Only students can be unassigned from companies", 400);
    }

    // Check if user is assigned to a company
    if (!user.metadata?.company) {
      throw new AppError("User is not assigned to any company", 400);
    }

    // Update user to remove company assignment
    const updateData: Partial<UserModel> = {
      metadata: {
        ...user.metadata,
        company: undefined,
        deploymentDate: undefined,
        status: "scheduled",
      },
    };

    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new AppError("Failed to unassign user from company", 500);
    }

    return updatedUser;
  }

  async updateUserDeploymentStatus(
    userId: string,
    status: "scheduled" | "deployed" | "completed"
  ): Promise<UserModel | null> {
    // Check if user exists
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is a student
    if (user.role !== "student") {
      throw new AppError("Only student deployment status can be updated", 400);
    }

    // Check if user is assigned to a company
    if (!user.metadata?.company) {
      throw new AppError("User is not assigned to any company", 400);
    }

    // Update user deployment status
    const updateData: Partial<UserModel> = {
      metadata: {
        ...user.metadata,
        status: status,
      },
    };

    const updatedUser = await this.userRepository.updateUser(userId, updateData);
    if (!updatedUser) {
      throw new AppError("Failed to update user deployment status", 500);
    }

    return updatedUser;
  }

  async getUserDashboard(userId: string, userRole: string): Promise<any> {
    const dashboardData = await this.userRepository.userDashboard(userId, userRole);

    if (!dashboardData || dashboardData.length === 0) {
      throw new AppError("Dashboard data not found", 404);
    }

    return dashboardData[0];
  }
}
