import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { AppError } from "../middleware/errorHandler";
import { upload } from "../middleware/multer";
import { UseMiddleware } from "../middleware/useMiddleware";
import { CloudinaryService } from "../services/cloudinaryService";
import { DocumentsService } from "../services/documentService";
import { EmailService } from "../services/emailService";
import { UserService } from "../services/userService";

@route("/document")
export class DocumentsController {
  private documentService: DocumentsService;
  private cloudinaryService: CloudinaryService;
  private emailService: EmailService;
  private userService: UserService;

  constructor() {
    this.documentService = new DocumentsService();
    this.cloudinaryService = new CloudinaryService();
    this.emailService = new EmailService();
    this.userService = new UserService();
  }

  @route.post("/")
  @UseMiddleware(upload.array("files", 10))
  async createAndUploadFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("Please upload at least one file", 400);
      }

      // Upload all files to Cloudinary
      const documents: string[] = [];
      for (const file of req.files) {
        const document = await this.cloudinaryService.uploadFile(file, "documents");
        documents.push(document);
      }

      // Create new document with uploaded files
      const documentData = {
        student: req.body.student,
        documentName: req.body.documentName || "Untitled Document",
        documents: documents,
        status: "pending" as const,
        remarks: req.body.remarks || "",
      };

      const document = await this.documentService.createDocument(documentData);
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  @route.get("/:id")
  getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const document = await this.documentService.getDocument(req.params.id);
      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/")
  getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const document = await this.documentService.getDocuments();
      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  @route.get("/student/:studentId")
  getDocumentsByStudentId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const documents = await this.documentService.getDocumentsByStudentId(req.params.studentId);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  };

  @route.patch("/")
  updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const document = await this.documentService.updateDocument(req.body);
      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  @route.delete("/:id")
  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      await this.documentService.deleteDocument(req.params.id);
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

      const document = await this.documentService.searchDocument(req.body);
      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  @route.post("/add-files/:id")
  @UseMiddleware(upload.array("files", 10))
  async addFilesToDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError("Please upload at least one file", 400);
      }

      // Upload all files to Cloudinary
      const documents: string[] = [];
      for (const file of req.files) {
        const document = await this.cloudinaryService.uploadFile(file, "documents");
        documents.push(document);
      }

      const document = await this.documentService.addFilesToDocument(req.params.id, documents);
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  @route.post("/remove-files/:id")
  async removeFilesFromDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      const { documents } = req.body;
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        throw new AppError("File URLs array is required", 400);
      }

      const document = await this.documentService.removeFilesFromDocument(req.params.id, documents);
      res.json(document);
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/approve/:id")
  async approveDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Check if user is coordinator
      // Check if user is coordinator or admin
      const user = (req as any).user;
      if (!user || !["coordinator", "admin"].includes(user.role)) {
        throw new AppError("Only coordinators or admins can approve documents", 403);
      }

      const { remarks } = req.body;
      const document = await this.documentService.approveDocument(req.params.id, remarks);

      // Notify student
      if (document && document.student) {
        this.userService.getUser(document.student as any).then(user => {
          if (user && user.email) {
            this.emailService.sendDocumentStatusUpdateNotification(
              user.email,
              document.documentName,
              "approved",
              remarks,
              `${(req as any).user.firstName} ${(req as any).user.lastName}`
            ).catch(console.error);
          }
        }).catch(console.error);
      }

      res.json({ message: "Document approved successfully", document });
    } catch (error) {
      next(error);
    }
  }

  @route.patch("/disapprove/:id")
  async disapproveDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Require authentication for this endpoint
      await requireAuthentication(req, res);

      // Check if user is coordinator
      // Check if user is coordinator or admin
      const user = (req as any).user;
      if (!user || !["coordinator", "admin"].includes(user.role)) {
        throw new AppError("Only coordinators or admins can disapprove documents", 403);
      }

      const { remarks } = req.body;
      if (!remarks || remarks.trim() === "") {
        throw new AppError("Remarks are required when disapproving a document", 400);
      }

      const document = await this.documentService.disapproveDocument(req.params.id, remarks);

      // Notify student
      if (document && document.student) {
        this.userService.getUser(document.student as any).then(user => {
          if (user && user.email) {
            this.emailService.sendDocumentStatusUpdateNotification(
              user.email,
              document.documentName,
              "disapproved", // or 'rejected'
              remarks,
              `${(req as any).user.firstName} ${(req as any).user.lastName}`
            ).catch(console.error);
          }
        }).catch(console.error);
      }

      res.json({ message: "Document disapproved", document });
    } catch (error) {
      next(error);
    }
  }
}
