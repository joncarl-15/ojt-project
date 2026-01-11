import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { AppError } from "../middleware/errorHandler";
import { DocumentsService } from "../services/documentService";
import { UserService } from "../services/userService";

@route("/archive")
export class ArchiveController {
    private userService: UserService;
    private documentService: DocumentsService;

    constructor() {
        this.userService = new UserService();
        this.documentService = new DocumentsService();
    }

    // Get all archived items (users and documents) or specific type based on query
    @route.get("/users")
    async getArchivedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const users = await this.userService.getArchivedUsers((req as any).user);
            res.json(users);
        } catch (error) {
            next(error);
        }
    }

    @route.get("/documents")
    async getArchivedDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const documents = await this.documentService.getArchivedDocuments((req as any).user);
            res.json(documents);
        } catch (error) {
            next(error);
        }
    }

    // Restore User
    @route.patch("/restore/user/:id")
    async restoreUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const user = await this.userService.restoreUser(req.params.id);
            res.json({ message: "User restored successfully", user });
        } catch (error) {
            next(error);
        }
    }

    // Restore Document
    @route.patch("/restore/document/:id")
    async restoreDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const document = await this.documentService.restoreDocument(req.params.id);
            res.json({ message: "Document restored successfully", document });
        } catch (error) {
            next(error);
        }
    }

    // Permanent Delete User
    @route.delete("/user/:id")
    async permanentDeleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            await this.userService.permanentDeleteUser(req.params.id);
            res.json({ message: "User permanently deleted" });
        } catch (error) {
            next(error);
        }
    }

    // Permanent Delete Document
    @route.delete("/document/:id")
    async permanentDeleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            await this.documentService.permanentDeleteDocument(req.params.id);
            res.json({ message: "Document permanently deleted" });
        } catch (error) {
            next(error);
        }
    }

    // Export Data
    @route.get("/export")
    async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const users = await this.userService.getArchivedUsers();
            const documents = await this.documentService.getArchivedDocuments();

            const exportData = {
                users,
                documents,
                exportDate: new Date(),
            };

            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", "attachment; filename=archive_export.json");
            res.json(exportData);
        } catch (error) {
            next(error);
        }
    }

    // Import Data
    @route.post("/import")
    async importData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const { users, documents } = req.body;

            if (!users && !documents) {
                throw new AppError("Invalid import data. Must contain users or documents.", 400);
            }

            const results = {
                usersImported: 0,
                documentsImported: 0,
                errors: [] as string[],
            };

            if (users && Array.isArray(users)) {
                console.log(`Processing ${users.length} users for import`);
                for (const userData of users) {
                    try {
                        // Check if user exists by ID or Email to avoid duplicates, 
                        // but since this is an "Archive Import", maybe we should check if they can be restored?
                        // Or are we importing INTO the archive?
                        // The requirement says "export and import data". 
                        // Simplest is to try to create them if they don't exist, preserving Archive status if present in data.
                        // However, directly creating with _id might conflict. 
                        // For this MVP version, let's assume importing restores them to the database, potentially as archived items.

                        // If we assume we are importing from a backup of archives, we probably want to insert them.
                        // We'll use a modified create or update approach.
                        let existing = null;
                        try {
                            existing = await this.userService.searchUser({
                                email: userData.email,
                                isArchived: undefined, // Force search all including archived
                            });
                        } catch (e: any) {
                            if (e.statusCode === 404 || e.message === "User not found") {
                                existing = null;
                            } else {
                                throw e;
                            }
                        }

                        if (!existing) {
                            // Create as new
                            console.log(`Creating new user: ${userData.email}`);
                            await this.userService.createUser(userData);
                            results.usersImported++;
                        } else {
                            // Update existing user, including archive status
                            console.log(`Updating existing user: ${userData.email} (ID: ${(existing as any)._id})`);
                            await this.userService.updateUser({ ...userData, _id: (existing as any)._id });
                            results.usersImported++;
                        }
                    } catch (err: any) {
                        console.error(`Import error for user ${userData.email}:`, err);
                        results.errors.push(`Failed to import user ${userData.email}: ${err.message}`);
                    }
                }
            }

            // Import Documents
            // Since documents rely on Student IDs, importing documents for users that don't exist will be tricky.
            // This is a complex feature. For now, I will implement a basic import that tries to create documents.
            if (documents && Array.isArray(documents)) {
                for (const docData of documents) {
                    try {
                        // Ideally we check if student exists
                        await this.documentService.createDocument(docData);
                        results.documentsImported++;
                    } catch (err: any) {
                        results.errors.push(`Failed to import document ${docData.documentName}: ${err.message}`);
                    }
                }
            }

            res.json({ message: "Import process completed", results });
        } catch (error) {
            next(error);
        }
    }
}
