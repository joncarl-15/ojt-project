import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
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
      let targetProgram = "all";
      if (req.user?.role === "coordinator" && req.user?.program) {
        targetProgram = req.user.program;
      }

      const announcementData = {
        title: req.body.title,
        content: req.body.content,
        createdBy: req.user!.id as any,
        targetProgram: req.body.targetProgram || targetProgram,
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
  updateAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

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
  deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.announcementService.deleteAnnouncement(req.params.id);
      res.send("User deleted successfully");
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
