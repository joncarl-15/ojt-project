import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { TokenPayload } from "../helpers/interface";
import { AppError } from "../middleware/errorHandler";
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { CloudinaryService } from "../services/cloudinaryService";
import { TaskService } from "../services/taskService";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@route("/task")
export class TaskController {
  private taskService: TaskService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.taskService = new TaskService();
    this.cloudinaryService = new CloudinaryService();
  }

  @route.post("/")
  @UseMiddleware(upload.array("files", 10))
  async createAndUploadFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Upload all files to Cloudinary (if any)
      const documents: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files) {
          const task = await this.cloudinaryService.uploadFile(file, "task-documents");
          documents.push(task);
        }
      }

      // Create new task with or without uploaded files
      const documentData = {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        createdBy: req.user!.id as any,
        assignedTo: req.body.assignedTo,
        submissionProofUrl: documents,
        status: "pending" as const,
      };

      const task = await this.taskService.createTask(documentData);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const task = await this.taskService.getTask(req.params.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const task = await this.taskService.getTasks();
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/student/:studentId")
  getTasksByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const tasks = await this.taskService.getTasksByStudentId(req.params.studentId);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/")
  updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const task = await this.taskService.updateTask(req.body);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.taskService.deleteTask(req.params.id);
      res.send("Data deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  @route.post("/search")
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const task = await this.taskService.searchTask(req.body);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  @route.post("/add-files/:id")
  @UseMiddleware(upload.array("files", 10))
  async addFilesToSubmissionProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("Please upload at least one file", 400);
      }

      // Upload all files to Cloudinary
      const documents: string[] = [];
      for (const file of req.files) {
        const task = await this.cloudinaryService.uploadFile(file, "task-documents");
        documents.push(task);
      }

      const task = await this.taskService.addFilesToSubmissionProof(req.params.id, documents);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/remove-files/:id")
  async removeFilesToSubmissionProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const { documents } = req.body;
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        throw new AppError("File URLs array is required", 400);
      }

      const task = await this.taskService.removeFilesToSubmissionProof(req.params.id, documents);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
}
