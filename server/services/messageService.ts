import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { MessageModel } from "../models/messageModel";
import { MessageRepository } from "../repositories/messageRepository";
import { EmailService } from "./emailService";
import { Server as SocketIOServer } from "socket.io";

export class MessageService {
  private messageRepository: MessageRepository;
  private emailService: EmailService;

  constructor() {
    this.messageRepository = new MessageRepository();
    this.emailService = new EmailService();
  }

  async getMessage(id: string, userId?: string, io?: SocketIOServer): Promise<MessageModel | null> {
    const message = await this.messageRepository.getMessage(id);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Emit message viewed event
    if (io && userId) {
      io.to(userId).emit("messageViewed", {
        messageId: message._id,
        viewedAt: new Date(),
      });

      // If the viewing user is the receiver, emit to sender that message was seen
      if (String(message.receiver) === userId && message.sender) {
        io.to(String(message.sender)).emit("messageSeen", {
          messageId: message._id,
          seenBy: userId,
          seenAt: new Date(),
        });
      }
    }

    return message;
  }

  async getMessages(userId?: string, io?: SocketIOServer): Promise<MessageModel[]> {
    let query: any = {};

    if (userId) {
      // Find conversations where the user is a participant
      // We need to import ConversationRepository here or inject it, but for now let's use the Conversation model directly or assume we can filter on receiver
      // Actually simpler:
      // Messages where:
      // 1. sender is user
      // 2. receiver is user (direct)
      // 3. receiver is a Conversation AND user is in participants (We need to look up conversations first or use aggregation)

      // Efficient approach: Get all conversation IDs the user is in.
      const { Conversation } = await import("../models/conversationModel");
      const userConversations = await Conversation.find({ participants: userId }).select('_id');
      const conversationIds = userConversations.map(c => c._id);

      query = {
        $or: [
          { sender: userId },
          { receiver: userId },
          { receiver: { $in: conversationIds }, receiverModel: 'Conversation' }
        ]
      };
    }

    const messages = await this.messageRepository.getMessages(query);

    // Emit messages fetched event
    if (io && userId) {
      io.to(userId).emit("messagesFetched", {
        userId: userId,
        messagesCount: messages.length,
        fetchedAt: new Date(),
      });
    }

    return messages;
  }

  async createMessage(data: Partial<MessageModel>, io?: SocketIOServer) {
    if (!data) {
      throw new AppError("Message data are required", 400);
    }

    // Auto-detect receiver model if not provided
    if (data.receiver && !data.receiverModel) {
      // Check if receiver is a user or conversation
      const { Conversation } = await import("../models/conversationModel");
      const conversation = await Conversation.findById(data.receiver);
      data.receiverModel = conversation ? 'Conversation' : 'User';
    }

    const message = await this.messageRepository.createMessage(data);

    // Emit the message to both sender and receiver rooms for real-time updates
    if (io && message) {
      const populatedMessage = await this.messageRepository.getMessage(message._id);

      // Emit to receiver
      const receiverId = (message.receiver as any)._id ? (message.receiver as any)._id.toString() : String(message.receiver);
      const senderId = (message.sender as any)._id ? (message.sender as any)._id.toString() : String(message.sender);

      if (message.receiverModel === 'Conversation') {
        io.to(receiverId).emit("newMessage", populatedMessage);
      } else {
        if (message.receiver) {
          io.to(receiverId).emit("newMessage", populatedMessage);
        }
      }

      // Emit to sender
      if (message.sender) {
        io.to(senderId).emit("messageSent", populatedMessage);
      }
    }

    // Send email notification to recipient (ONLY for direct messages)
    if (message.receiverModel === 'User') {
      try {
        await this.emailService.sendMessageNotificationToRecipient(message);
      } catch (error) {
        console.error("Failed to send message email notification:", error);
      }
    } else if (message.receiverModel === 'Conversation') {
      try {
        const conversationId = (message.receiver as any)._id ? (message.receiver as any)._id.toString() : String(message.receiver);
        await this.emailService.sendGroupMessageNotification(message, conversationId);
      } catch (error) {
        console.error("Failed to send group message notification:", error);
      }
    }

    return message;
  }

  async updateMessage(
    id: string,
    content: string,
    userId: string,
    io?: SocketIOServer
  ): Promise<MessageModel | null> {
    const message = await this.messageRepository.getMessage(id);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Verify sender
    if (String((message.sender as any)._id || message.sender) !== userId) {
      throw new AppError("You can only edit your own messages", 403);
    }

    const updatedMessage = await this.messageRepository.updateMessage(id, { content });

    // Emit update event
    if (io && updatedMessage) {
      const eventData = { messageId: id, content: content, updatedAt: new Date() };

      const receiverId = (updatedMessage.receiver as any)?._id ? (updatedMessage.receiver as any)._id.toString() : String(updatedMessage.receiver);
      const senderId = (updatedMessage.sender as any)?._id ? (updatedMessage.sender as any)._id.toString() : String(updatedMessage.sender);

      if (updatedMessage.receiver) {
        io.to(receiverId).emit("messageUpdated", eventData);
      }
      if (updatedMessage.sender) {
        io.to(senderId).emit("messageUpdated", eventData);
      }
    }

    return updatedMessage;
  }

  async deleteMessage(id: string, userId: string, io?: SocketIOServer): Promise<void> {
    const message = await this.messageRepository.getMessage(id);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Verify sender
    if (String((message.sender as any)._id || message.sender) !== userId) {
      throw new AppError("You can only delete your own messages", 403);
    }

    await this.messageRepository.deleteMessage(id);

    if (io) {
      const receiverId = (message.receiver as any)?._id ? (message.receiver as any)._id.toString() : String(message.receiver);
      const senderId = (message.sender as any)?._id ? (message.sender as any)._id.toString() : String(message.sender);

      if (message.receiver) {
        io.to(receiverId).emit("messageDeleted", { messageId: id });
      }
      if (message.sender) {
        io.to(senderId).emit("messageDeleted", { messageId: id });
      }
    }
  }

  async markAsRead(
    messageId: string,
    userId: string,
    io?: SocketIOServer
  ): Promise<MessageModel | null> {
    const message = await this.messageRepository.getMessage(messageId);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Only receiver can mark message as read
    // For groups, logic might be different (e.g., readBy array), but typically we track last read message.
    // Assuming this is for DM for now.
    if (String(message.receiver) !== userId && message.receiverModel !== 'Conversation') {
      // Allow if Conversation participant? (Too complex for now, sticky to DM check or relax it)
      // If it's a conversation, any participant might trigger a "read" but usually it's per-user.
      // Let's keep logic simple: strict check for User model.
      if (message.receiverModel === 'User') {
        throw new AppError("Unauthorized to mark this message as read", 403);
      }
    }

    const updatedMessage = await this.messageRepository.updateMessage(messageId, { isRead: true });

    // Emit read receipt to sender
    if (io && updatedMessage && message.sender) {
      const senderId = (message.sender as any)._id ? (message.sender as any)._id.toString() : String(message.sender);
      io.to(senderId).emit("messageRead", {
        messageId: updatedMessage._id,
        isRead: true,
      });
    }

    return updatedMessage;
  }

  async markAllAsRead(userId: string, io?: SocketIOServer): Promise<void> {
    const query = {
      receiver: userId,
      receiverModel: 'User',
      isRead: false
    };

    await this.messageRepository.searchAndUpdate(query, { isRead: true }, { multi: true });

    if (io) {
      io.to(userId).emit("allMessagesRead", {
        userId: userId,
        readAt: new Date()
      });
    }
  }

  async markConversationAsRead(
    targetId: string,
    userId: string,
    type: 'direct' | 'group',
    io?: SocketIOServer
  ): Promise<void> {
    let query: any = { isRead: false };

    if (type === 'group') {
      // For groups, we mark messages sent to the group as read.
      // NOTE: With current schema, reading a group message marks it as read for EVERYONE.
      // Ideally schema needs readBy: [userId], but for this expected MVP behavior we proceed.
      query.receiver = targetId;
      query.receiverModel = 'Conversation';
      // Exclude own messages? Usually yes, but sender is us, isRead should be false by default until someone reads?
      // Actually unread count check is !isOwn.
      // So we only care about messages NOT from us.
      query.sender = { $ne: userId };
    } else {
      // Direct message: Messages sent BY the target TO us
      query.sender = targetId;
      query.receiver = userId;
      query.receiverModel = 'User';
    }

    await this.messageRepository.searchAndUpdate(query, { isRead: true }, { multi: true });

    // Emit event to update UI in real-time
    if (io) {
      // Notify the user (to clear their own badge via socket if multiple tabs/devices)
      io.to(userId).emit("conversationRead", {
        conversationId: targetId,
        readBy: userId
      });

      // For DM, notify the sender that we read their messages (Read Receipt)
      if (type === 'direct') {
        io.to(targetId).emit("conversationReadByPeer", {
          peerId: userId,
          conversationId: userId // From sender's perspective, convo ID is our ID
        });
      }
    }
  }

  async searchMessage(
    query: FilterQuery<MessageModel>,
    userId?: string,
    io?: SocketIOServer
  ): Promise<MessageModel | null> {
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<MessageModel>);

    const message = await this.messageRepository.searchMessage(caseInsensitiveQuery);

    // Emit search performed event
    if (io && userId) {
      io.to(userId).emit("messageSearched", {
        userId: userId,
        searchQuery: query,
        resultFound: !!message,
        searchedAt: new Date(),
      });
    }

    return message;
  }
}
