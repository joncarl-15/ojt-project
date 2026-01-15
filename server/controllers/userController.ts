import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { CloudinaryService } from "../services/cloudinaryService";
import { UserService } from "../services/userService";
import { EmailService } from "../services/emailService";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Purpose: This controller class is responsible for handling the user related requests.
@route("/user")
export class UserController {
  private userService: UserService;
  private cloudinaryService: CloudinaryService;
  private emailService: EmailService;

  constructor() {
    this.userService = new UserService();
    this.cloudinaryService = new CloudinaryService();
    this.emailService = new EmailService();
  }

  @route.post("/")
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await requireAuthentication(req, res);

      // Capture raw password before it gets hashed by userService
      const rawPassword = req.body.password;

      const user = await this.userService.createUser(req.body, (req as AuthenticatedRequest).user);

      // Send account creation email (if not student registering themselves self-service, usually admin/coordinator creates)
      if (req.body.email && rawPassword) {
        // Run in background to not block response
        this.emailService.sendAccountCreatedNotification(
          req.body.email,
          req.body.userName,
          rawPassword,
          req.body.role,
          req.body.firstName,
          req.body.lastName
        ).catch(err => console.error("Failed to send account creation email:", err));
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/:id")
  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const users = await this.userService.getUsers((req as AuthenticatedRequest).user);
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/")
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        throw new AppError("Authentication required", 401);
      }

      const targetUserId = req.body._id || userId;

      // Check if username is being updated
      if (req.body.userName) {
        const { comparePasswords } = await import("../helpers/auth");
        // key fix: get the TARGET user, not just the logged in user
        const targetUser = await this.userService.getUser(targetUserId);
        const currentUser = await this.userService.getUser(userId);

        // If updating self
        if (userId === targetUserId) {
          if (targetUser && targetUser.userName !== req.body.userName) {
            // Username is changing, require password
            if (!req.body.currentPassword) {
              throw new AppError("Current password is required to change username", 400);
            }

            const isPasswordValid = await comparePasswords(req.body.currentPassword, targetUser.password);
            if (!isPasswordValid) {
              throw new AppError("Invalid current password", 401);
            }

            // Check for 30-day limit
            if (targetUser.lastUsernameChangeDate) {
              const daysSinceLastChange = (Date.now() - new Date(targetUser.lastUsernameChangeDate).getTime()) / (1000 * 60 * 60 * 24);
              if (daysSinceLastChange < 30) {
                const daysRemaining = Math.ceil(30 - daysSinceLastChange);
                throw new AppError(`You can only change your username once every 30 days. Please try again in ${daysRemaining} days.`, 403);
              }
            }

            // Update the last change date
            req.body.lastUsernameChangeDate = new Date();
          }
        } else {
          // Updating another user (Admin check)
          if (currentUser?.role !== 'admin' && currentUser?.role !== 'coordinator') {
            throw new AppError("Unauthorized to update this user", 403);
          }
          // Admins/Coordinators can update username without password check of the target user
        }
      }

      const user = await this.userService.updateUser(req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.userService.deleteUser(req.params.id);
      res.send("User deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id/permanent")
  permanentDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Verify the user is deleting themselves OR is an admin?
      // Requirement: "make it permanently delete when deleting account using admin"
      // If the authenticated user is an admin, they can do this.
      // If the authenticated user is deleting their OWN account, they can do this.
      const requestingUser = (req as AuthenticatedRequest).user;
      if (!requestingUser) {
        throw new AppError("Authentication required", 401);
      }

      // Allow if admin or if deleting self
      if (requestingUser.role !== 'admin' && requestingUser.id !== req.params.id) {
        throw new AppError("Unauthorized to permanently delete this user", 403);
      }

      await this.userService.permanentDeleteUser(req.params.id);
      res.send("User permanently deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      console.log("User search query received:", req.body);
      const users = await this.userService.searchUser(
        req.body,
        {
          multiple: true,
        },
        (req as AuthenticatedRequest).user
      );
      console.log("Users found:", Array.isArray(users) ? users.length : 1, "users");
      res.json(users);
    } catch (error) {
      next(error);
    }
  };

  @route.post("/upload/:id") // user id
  @UseMiddleware(upload.single("image"))
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      if (!req.file) {
        throw new AppError("Please upload an image", 400);
      }

      const imageUrl = await this.cloudinaryService.uploadImage(req.file, "user-avatars");
      const updateData = {
        _id: req.params.id,
        avatar: imageUrl,
      };

      const user = await this.userService.updateUser(updateData);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/assign-company")
  assignToCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const { userId, companyId, deploymentDate, status, coordinatorId } = req.body;

      if (!userId || !companyId || !coordinatorId) {
        throw new AppError("User ID and Company ID and Coordinator ID are required", 400);
      }

      const user = await this.userService.assignUserToCompany(
        userId,
        companyId,
        coordinatorId,
        deploymentDate,
        status
      );
      res.json({
        message: "User successfully assigned to company",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  @route.post("/unassign-company")
  unassignFromCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const { userId } = req.body;

      if (!userId) {
        throw new AppError("User ID is required", 400);
      }

      const user = await this.userService.unassignUserFromCompany(userId);
      res.json({
        message: "User successfully unassigned from company",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/deployment-status")
  updateDeploymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const { userId, status, deploymentDate } = req.body;

      if (!userId || !status) {
        throw new AppError("User ID and status are required", 400);
      }

      if (!["scheduled", "deployed", "completed"].includes(status)) {
        throw new AppError("Invalid status. Must be 'scheduled', 'deployed', or 'completed'", 400);
      }

      const user = await this.userService.updateUserDeploymentStatus(userId, status, deploymentDate);
      res.json({
        message: "User deployment status updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  @route.get("/dashboard")
  getDashboard = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Get user info from the authenticated request
      if (!req.query.userId || !req.query.userRole) {
        throw new AppError("User  information is missing", 401);
      }

      const dashboardData = await this.userService.getUserDashboard(
        req.query.userId as string,
        req.query.userRole as string
      );
      res.json({
        message: "Dashboard data retrieved successfully",
        dashboard: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  };
}
