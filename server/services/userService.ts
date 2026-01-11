import { FilterQuery } from "mongoose";
import * as bcrypt from "bcryptjs";
import { TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { UserModel } from "../models/userModel";
import { UserRepository } from "../repositories/userRepository";
import { DocumentsRepository } from "../repositories/documentRepository";
import { MessageRepository } from "../repositories/messageRepository";
import { TaskRepository } from "../repositories/taskRepository";

// *Purpose: This service class is responsible for handling the business logic of the user entity. It interacts with the user repository to perform CRUD operations on the user entity.
export class UserService {
  private userRepository: UserRepository;
  private documentRepository: DocumentsRepository;
  private messageRepository: MessageRepository;
  private taskRepository: TaskRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.documentRepository = new DocumentsRepository();
    this.messageRepository = new MessageRepository();
    this.taskRepository = new TaskRepository();
  }

  async getUser(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.getUser(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getDashboard(userId: string, targetRole: string, requestingUser?: TokenPayload): Promise<any> {
    // If coordinator, ensure they can only view their own dashboard? 
    // Actually, dashboard is usually for the logged-in user.
    // But if we are an admin viewing another user's dashboard...
    // The previous implementation used req.query.userId.

    // For program filtered stats, we need to pass the program down.

    let program: "bsit" | "bsba" | undefined = undefined;

    if (requestingUser?.role === 'coordinator') {
      program = requestingUser.program as "bsit" | "bsba";
    } else {
      // If admin viewing a coordinator/student, we might want to know that user's program?
      // But for "Coordinator Program Isolation", the stats on the Coordinator's dashboard should be filtered.
      // If the user being viewed IS a coordinator, we should use THEIR program.
      const targetUser = await this.userRepository.getUser(userId);
      if (targetUser && (targetUser.role === 'coordinator' || targetUser.role === 'student')) {
        program = targetUser.program;
      }
    }

    const dashboardData = await this.userRepository.userDashboard(userId, targetRole, program);

    if (!dashboardData || dashboardData.length === 0) {
      throw new AppError("Dashboard data not found", 404);
    }

    return dashboardData[0];
  }

  // Renamed to match controller usage if needed, or update controller calling code.
  // Controller calls 'getUserDashboard'
  async getUserDashboard(userId: string, userRole: string, requestingUser?: TokenPayload): Promise<any> {
    return this.getDashboard(userId, userRole, requestingUser);
  }

  async getUsers(requestingUser?: TokenPayload): Promise<UserModel[]> {
    const query: any = {};
    if (requestingUser?.role === 'coordinator' && requestingUser.program) {
      query.program = requestingUser.program;
      // Coordinators should probably only see STUDENTS? Or other coordinators too?
      // "view its assigned student... even on dashboard"
      // Let's filter by program.
    }
    return this.userRepository.getUsers(query);
  }

  async createUser(userData: Partial<UserModel>, requestingUser?: TokenPayload) {
    if (!userData.firstName || !userData.lastName) {
      throw new AppError("User firstname and lastname data are required", 400);
    }

    if (!userData.email) {
      throw new AppError("Email is required", 400);
    }

    if (!userData.role) {
      throw new AppError("Invalid role. Must be admin, coordinator, or student", 400);
    }

    // Program Isolation: If coordinator, force program
    if (requestingUser?.role === 'coordinator') {
      if (!requestingUser.program) {
        throw new AppError("Coordinator has no program assigned", 500);
      }
      userData.program = requestingUser.program as "bsit" | "bsba";
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
    if (userData.program && (userData.role === 'student' || userData.role === 'coordinator')) {
      try {
        const { ConversationService } = await import("./conversationService");
        const conversationService = new ConversationService();
        const { Message } = await import("../models/messageModel");

        // Ensure group exists
        let group = await conversationService.getProgramGroup(userData.program as "bsit" | "bsba");

        if (!group) {
          // Create group with Coordinator (requestingUser) as admin if available
          const adminId = requestingUser?.role === 'coordinator' ? requestingUser.id : createdUser._id;
          const groupName = userData.program.toUpperCase() + " Group Chat";

          group = await conversationService.createProgramGroup(
            userData.program as "bsit" | "bsba",
            adminId,
            groupName
          );

          // If coordinator created it, ensure they are in it (createProgramGroup might handle this but let's be safe)
          // createProgramGroup adds the adminId as participant.
        }

        // Add the new student to the group
        await conversationService.addUserToGroup(group._id, createdUser._id);

        // If the coordinator triggered this and isn't in the group yet (e.g. group existed before but they weren't in it), add them
        if (requestingUser?.role === 'coordinator') {
          // Check if already in? addUserToGroup typically handles duplicates or we can just try
          await conversationService.addUserToGroup(group._id, requestingUser.id);
        }

        // Send "Just hopped in!" message
        await Message.create({
          sender: createdUser._id, // The student sent it? Or system? "Student just hopped in!" sounds like system.
          // User request: "student bsit 1 just hopped in!"
          // Usually such messages are system messages or sent by the user themselves automatically.
          // Let's make the student say it for now, or use a system flag if available. 
          // Using student ID as sender makes it look like they sent it, which fits.
          receiver: group._id,
          receiverModel: 'Conversation',
          content: `${createdUser.firstName} ${createdUser.lastName} just hopped in!`,
          sentAt: new Date()
        });

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
    if (updateData.program && (user.role === 'student' || user.role === 'coordinator')) {
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

  async restoreUser(id: string): Promise<UserModel | null> {
    const user = await this.userRepository.restoreUser(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async permanentDeleteUser(id: string): Promise<UserModel | null> {
    // Cascade delete related data
    await this.documentRepository.deleteDocumentsByStudentId(id);
    await this.messageRepository.deleteMessagesByUserId(id);
    await this.taskRepository.removeStudentFromTasks(id);

    const user = await this.userRepository.permanentDeleteUser(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async getArchivedUsers(requestingUser?: TokenPayload): Promise<UserModel[]> {
    const filter: FilterQuery<UserModel> = {};
    if (requestingUser?.role === 'coordinator' && requestingUser.program) {
      filter.program = requestingUser.program;
      // Coordinators can only see Students and potentially other Coordinators of the same program?
      // Requirement: "show bsit student account... and bsba info for the coordinator bsba"
      // Usually coordinators only manage students. Showing other coordinators might be fine or not.
      // Let's filter by program first.
      // If we want to restrict Role to "student" too, we can add that.
      // "show bsit student account" implies filtering by role too.
      // Let's stick to program filter for now, as that's the main isolation.
      // If they want to see archived coordinators of the same program, that's fine.
    }
    return this.userRepository.getArchivedUsers(filter);
  }

  async searchUser(
    query: FilterQuery<UserModel>,
    options?: { multiple?: boolean },
    requestingUser?: TokenPayload
  ): Promise<UserModel | UserModel[]> {
    // Fields that require exact matching (not regex)
    const exactMatchFields = ["role", "program", "email"];

    // Check for coordinator program isolation
    if (requestingUser?.role === 'coordinator' && requestingUser.program) {
      // Enforce program filter
      query.program = requestingUser.program;
      // Optionally ensure they only search for students?
      // But maybe they need to search for other coordinators?
      // "can only view its assigned student" implies student restriction.
      // Let's enforce it strongly if query doesn't specify role, default to student?
      // Or just let filtering usage handle role specificities.
    }

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


}
