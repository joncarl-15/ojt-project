import { ConversationRepository } from "../repositories/conversationRepository";
import { ConversationModel } from "../models/conversationModel";
import { AppError } from "../middleware/errorHandler";

export class ConversationService {
    private conversationRepository: ConversationRepository;

    constructor() {
        this.conversationRepository = new ConversationRepository();
    }

    async getConversation(id: string): Promise<ConversationModel | null> {
        const conversation = await this.conversationRepository.getConversation(id);
        if (!conversation) {
            throw new AppError("Conversation not found", 404);
        }
        return conversation;
    }

    async getUserConversations(userId: string): Promise<ConversationModel[]> {
        return this.conversationRepository.getConversations({
            participants: userId,
        });
    }

    async createGroup(
        data: Partial<ConversationModel>
    ): Promise<ConversationModel> {
        if (!data.name) {
            throw new AppError("Group name is required", 400);
        }
        return this.conversationRepository.createConversation({
            ...data,
            type: "group",
        });
    }

    async getProgramGroup(program: "bsit" | "bsba"): Promise<ConversationModel | null> {
        const groups = await this.conversationRepository.getConversations({ program });
        return groups[0] || null;
    }

    async createProgramGroup(program: "bsit" | "bsba", adminId: string, name: string): Promise<ConversationModel> {
        const existing = await this.getProgramGroup(program);
        if (existing) return existing;

        const group = await this.conversationRepository.createConversation({
            name: name,
            type: "group",
            program: program,
            admins: [adminId as any],
            participants: [adminId as any]
        });

        // Create a welcome message so the group shows up in chats
        try {
            const { Message } = await import("../models/messageModel");
            await Message.create({
                sender: adminId, // Or a system ID? For now adminId is fine
                receiver: group._id,
                receiverModel: 'Conversation',
                content: `Welcome to the ${name}!`,
                sentAt: new Date()
            });
        } catch (error) {
            console.error("Failed to create welcome message:", error);
        }

        return group;
    }

    async addUserToGroup(conversationId: string, userId: string): Promise<ConversationModel | null> {
        return this.conversationRepository.addParticipant(conversationId, userId);
    }
}
