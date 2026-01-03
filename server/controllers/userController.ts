import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { CloudinaryService } from "../services/cloudinaryService";
import { UserService } from "../services/userService";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Purpose: This controller class is responsible for handling the user related requests.
@route("/user")
export class UserController {
  private userService: UserService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.userService = new UserService();
    this.cloudinaryService = new CloudinaryService();
  }

  @route.post("/")
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.createUser(req.body);
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

      const users = await this.userService.getUsers();
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

  @route.post("/search")
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      console.log("User search query received:", req.body);
      const users = await this.userService.searchUser(req.body, {
        multiple: true,
      });
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

      const { userId, status } = req.body;

      if (!userId || !status) {
        throw new AppError("User ID and status are required", 400);
      }

      if (!["scheduled", "deployed", "completed"].includes(status)) {
        throw new AppError("Invalid status. Must be 'scheduled', 'deployed', or 'completed'", 400);
      }

      const user = await this.userService.updateUserDeploymentStatus(userId, status);
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
