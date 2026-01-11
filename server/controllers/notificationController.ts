import { NextFunction, Request, Response } from "express";
import { route } from "express-extract-routes";
import { requireAuthentication } from "../helpers/auth";
import { DocumentsService } from "../services/documentService";
import { MessageModel, Message } from "../models/messageModel";
import { TaskModel, Task } from "../models/taskModel";
import { DocumentsModel, Documents } from "../models/documentModel";

@route("/user")
export class NotificationController {
    private documentService: DocumentsService;

    constructor() {
        this.documentService = new DocumentsService();
    }

    @route.get("/notifications")
    async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await requireAuthentication(req, res);
            const user = (req as any).user;
            const userId = user._id;

            // 1. Fetch unread messages
            const unreadMessages = await Message.find({
                receiver: userId,
                isRead: false,
            })
                .populate("sender", "firstName lastName role")
                .sort({ createdAt: -1 })
                .limit(10);

            // 2. Fetch recent document updates (for students)
            let documentUpdates: DocumentsModel[] = [];
            if (user.role === "student") {
                // Find documents updated in the last 7 days where status is not pending
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                documentUpdates = await Documents.find({
                    student: userId,
                    status: { $in: ["approved", "rejected"] },
                    statusUpdatedAt: { $gte: sevenDaysAgo }
                }).sort({ statusUpdatedAt: -1 }).limit(10);
            }

            // 3. Fetch new tasks (for students)
            let newTasks: TaskModel[] = [];
            if (user.role === "student") {
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                newTasks = await Task.find({
                    assignedTo: userId,
                    createdAt: { $gte: threeDaysAgo }
                }).populate("createdBy", "firstName lastName").sort({ createdAt: -1 }).limit(5);
            }

            // 4. Combine and Sort
            const notifications = [
                ...unreadMessages.map(msg => ({
                    type: 'message',
                    id: msg._id,
                    title: `Message from ${(msg.sender as any)?.firstName || 'Coordinator'}`,
                    content: msg.content || 'Image Attachment',
                    createdAt: msg.createdAt,
                    metadata: { senderId: msg.sender }
                })),
                ...documentUpdates.map(doc => ({
                    type: 'document',
                    id: doc._id,
                    title: `Document ${doc.status === 'approved' ? 'Approved' : 'Rejected'}`,
                    content: `Your document "${doc.documentName}" has been ${doc.status}. ${doc.remarks ? `Remarks: ${doc.remarks}` : ''}`,
                    createdAt: doc.statusUpdatedAt || doc.uploadedAt, // Fallback
                    metadata: { status: doc.status, remarks: doc.remarks }
                })),
                ...newTasks.map(task => ({
                    type: 'task',
                    id: task._id,
                    title: 'New Task Assigned',
                    content: `You have been assigned a new task: "${task.title}".`,
                    createdAt: (task as any).createdAt,
                    metadata: { dueDate: task.dueDate }
                }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            res.json(notifications);

        } catch (error) {
            next(error);
        }
    }
}
