import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { MessageService } from "../services/messageService";
import { TokenPayload } from "../helpers/interface";
import { Server as SocketIOServer } from "socket.io";
import { UseMiddleware } from "../middleware/useMiddleware";
import { upload } from "../middleware/multer";
import { AppError } from "../middleware/errorHandler";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
import { CloudinaryService } from "../services/cloudinaryService";

@route("/message")
export class MessageController {
  private messageService: MessageService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.messageService = new MessageService();
    this.cloudinaryService = new CloudinaryService();
  }

  private getSocketIO(req: Request): SocketIOServer | undefined {
    return req.app.get("io");
  }

  @route.post("/")
  createMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);

      const messageData = {
        sender: req.user!.id as any,
        receiver: req.body.receiver,
        receiverModel: req.body.receiverModel, // Fix: Explicitly pass receiverModel
        content: req.body.content,
        image: req.body.image, // New: Pass image
        isRead: req.body.isRead,
        sentAt: req.body.sentAt,
      };

      const message = await this.messageService.createMessage(messageData, io);
      res.json(message);
    } catch (error) {
      next(error);
    }
  };

  @route.post("/upload")
  @UseMiddleware(upload.single("image"))
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication
      await requireAuthentication(req, res);

      if (!req.file) {
        throw new AppError("Please upload an image", 400);
      }

      const imageUrl = await this.cloudinaryService.uploadImage(req.file, "message-images");
      res.json({ imageUrl });

    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  getMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      const message = await this.messageService.getMessage(req.params.id, req.user!.id, io);
      res.json(message);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getMessages = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      const messages = await this.messageService.getMessages(req.user!.id, io);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/:id")
  updateMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      // Pass userId to verify ownership
      const message = await this.messageService.updateMessage(req.params.id, req.body.content, req.user!.id, io);
      res.json(message);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      // Pass userId to verify ownership
      await this.messageService.deleteMessage(req.params.id, req.user!.id, io);
      res.send("Message deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  searchMessage = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      const message = await this.messageService.searchMessage(req.body, req.user!.id, io);
      res.json(message);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/:id/read")
  markAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      const message = await this.messageService.markAsRead(req.params.id, req.user!.id, io);
      res.json(message);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/conversation/:id/read")
  markConversationAsRead = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await requireAuthentication(req, res);

      const io = this.getSocketIO(req);
      const { type = 'direct' } = req.body; // 'direct' or 'group'

      await this.messageService.markConversationAsRead(req.params.id, req.user!.id, type, io);

      res.json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  };
}
