import { Message, MessageModel } from "../models/messageModel";
import { FilterQuery, UpdateQuery } from "mongoose";

export class MessageRepository {
  async getMessage(id: string): Promise<MessageModel | null> {
    return Message.findById(id)
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async getMessages(query?: FilterQuery<MessageModel>): Promise<MessageModel[]> {
    return Message.find(query || {})
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async createMessage(data: Partial<MessageModel>): Promise<MessageModel> {
    const message = await Message.create(data);
    return message.populate(["sender", "receiver"]);
  }

  async updateMessage(
    id: string,
    data: Partial<MessageModel>
  ): Promise<MessageModel | null> {
    return Message.findByIdAndUpdate(id, data, { new: true })
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async deleteMessage(id: string): Promise<MessageModel | null> {
    return Message.findByIdAndDelete(id)
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async searchMessage(
    query: FilterQuery<MessageModel>
  ): Promise<MessageModel | null> {
    return Message.findOne(query)
      .populate("sender")
      .populate("receiver")
      .exec();
  }

  async searchAndUpdate(
    query: FilterQuery<MessageModel>,
    update?: UpdateQuery<MessageModel>,
    options?: { multi?: boolean }
  ): Promise<MessageModel | null | { modifiedCount: number }> {
    if (!update) {
      return Message.findOne(query)
        .populate("sender")
        .populate("receiver")
        .exec();
    }

    if (options?.multi) {
      const result = await Message.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Message.findOneAndUpdate(query, update, { new: true })
      .populate("sender")
      .populate("receiver")
      .exec();
  }
}
