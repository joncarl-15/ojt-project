import { Conversation, ConversationModel } from "../models/conversationModel";
import { FilterQuery, UpdateQuery } from "mongoose";

export class ConversationRepository {
    async getConversation(id: string): Promise<ConversationModel | null> {
        return Conversation.findById(id)
            .populate("participants")
            .populate("admins")
            .populate("lastMessage")
            .exec();
    }

    async getConversations(
        query?: FilterQuery<ConversationModel>
    ): Promise<ConversationModel[]> {
        return Conversation.find(query || {})
            .populate("participants")
            .populate("admins")
            .populate("lastMessage")
            .sort({ updatedAt: -1 })
            .exec();
    }

    async createConversation(
        data: Partial<ConversationModel>
    ): Promise<ConversationModel> {
        const conversation = await Conversation.create(data);
        return conversation.populate(["participants", "admins"]);
    }

    async updateConversation(
        id: string,
        data: UpdateQuery<ConversationModel>
    ): Promise<ConversationModel | null> {
        return Conversation.findByIdAndUpdate(id, data, { new: true })
            .populate("participants")
            .populate("admins")
            .populate("lastMessage")
            .exec();
    }

    async addParticipant(
        conversationId: string,
        userId: string
    ): Promise<ConversationModel | null> {
        return Conversation.findByIdAndUpdate(
            conversationId,
            { $addToSet: { participants: userId } },
            { new: true }
        )
            .populate("participants")
            .populate("admins")
            .exec();
    }
}
