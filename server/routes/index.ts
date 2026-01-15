import { extract } from "express-extract-routes";
import { AnnouncementController } from "../controllers/announcementController";
import { AuthController } from "../controllers/authController";
import { CompanyController } from "../controllers/companyController";
import { DocumentsController } from "../controllers/documentController";
import { MessageController } from "../controllers/messageController";
import { ServerController } from "../controllers/serverController";
import { TaskController } from "../controllers/taskController";
import { UserController } from "../controllers/userController";
import { RequirementsController } from "../controllers/requirementsController";
import { ConversationController } from "../controllers/conversationController";

import { ArchiveController } from "../controllers/archiveController";
import { NotificationController } from "../controllers/notificationController";

import { DTRController } from "../controllers/dtrController";

// Extract all routes from the controllers.
export const routes = extract(
  UserController,
  ServerController,
  AuthController,
  DocumentsController,
  TaskController,
  CompanyController,
  AnnouncementController,
  MessageController,
  RequirementsController,
  ConversationController,
  ArchiveController,
  NotificationController,
  DTRController
);
