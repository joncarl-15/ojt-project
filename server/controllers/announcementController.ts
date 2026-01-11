import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { AppError } from "../middleware/errorHandler";
import { AnnouncementService } from "../services/announcementService";
import { TokenPayload } from "../helpers/interface";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@route("/announcement")
export class AnnouncementController {
  private announcementService: AnnouncementService;

  constructor() {
    this.announcementService = new AnnouncementService();
  }

  @route.post("/")
  createAnnouncement = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Determine target program based on user role and program
      let targetProgram = req.body.targetProgram || "all";

      // Strict enforcement for Coordinators
      if (req.user?.role === "coordinator") {
        if (!req.user.program) {
          throw new Error("Coordinator must have a program assigned to create announcements.");
        }
        targetProgram = req.user.program;
      }

      const announcementData = {
        title: req.body.title,
        content: req.body.content,
        createdBy: req.user!.id as any,
        targetProgram: targetProgram,
      };

      const announcement = await this.announcementService.createAnnouncement(
        announcementData,
        req.user!.id
      );
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/:id")
  getAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const announcement = await this.announcementService.getAnnouncement(req.params.id);
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getAnnouncements = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Get user's program from token or query
      const userProgram = (req.query.program as string) || req.user?.program;

      const announcements = await this.announcementService.getAnnouncementsForUser(userProgram);
      res.json(announcements);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/:id")
  updateAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await requireAuthentication(req, res);

      // Check permissions
      const existingAnnouncement = await this.announcementService.getAnnouncement(req.params.id);
      if (!existingAnnouncement) {
        throw new AppError("Announcement not found", 404); // Or let service handle it, but we need it for auth check
      }

      if (req.user?.role !== "admin") {
        if (req.user?.role === "coordinator") {
          // Coordinators can only update their own
          if (existingAnnouncement.createdBy?.toString() !== req.user.id) {
            throw new AppError("You do not have permission to update this announcement", 403);
          }
        } else {
          // Students cannot update
          throw new AppError("You do not have permission to update announcements", 403);
        }
      }

      const updateData = {
        ...req.body,
        _id: req.params.id,
      };

      const announcement = await this.announcementService.updateAnnouncement(updateData);
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteAnnouncement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await requireAuthentication(req, res);

      // Check permissions
      const existingAnnouncement = await this.announcementService.getAnnouncement(req.params.id);
      if (!existingAnnouncement) {
        throw new AppError("Announcement not found", 404);
      }

      if (req.user?.role !== "admin") {
        if (req.user?.role === "coordinator") {
          // Coordinators can only delete their own
          if (existingAnnouncement.createdBy?.toString() !== req.user.id) {
            throw new AppError("You do not have permission to delete this announcement", 403);
          }
        } else {
          // Students cannot delete
          throw new AppError("You do not have permission to delete announcements", 403);
        }
      }

      await this.announcementService.deleteAnnouncement(req.params.id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  searchAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const announcement = await this.announcementService.searchAnnouncement(req.body);
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  };
}
