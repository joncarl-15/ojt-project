import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { AppError } from "../middleware/errorHandler";
import { ConversationService } from "../services/conversationService";

@route("/conversation")
export class ConversationController {
    private conversationService: ConversationService;

    constructor() {
        this.conversationService = new ConversationService();
    }

    @route.post("/group")
    createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const group = await this.conversationService.createGroup(req.body);
            res.json(group);
        } catch (error) {
            next(error);
        }
    };

    @route.get("/")
    getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const userId = (req as any).user._id;
            const conversations = await this.conversationService.getUserConversations(userId);
            res.json(conversations);
        } catch (error) {
            next(error);
        }
    };

    @route.post("/:id/members")
    addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await requireAuthentication(req, res);
            const { userId } = req.body;
            if (!userId) throw new AppError("User ID is required", 400);

            const conversation = await this.conversationService.addUserToGroup(req.params.id, userId);
            res.json(conversation);
        } catch (error) {
            next(error);
        }
    };
}
