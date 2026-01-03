import mongoose, { Document, Schema } from "mongoose";

export interface MessageModel extends Document {
  sender: Schema.Types.ObjectId;
  receiver: Schema.Types.ObjectId;
  receiverModel: 'User' | 'Conversation';
  content?: string;
  image?: string;
  isRead: Boolean;
  sentAt: Date;
}

const MessageSchema = new Schema<MessageModel>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'receiverModel'
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ['User', 'Conversation'],
      default: 'User'
    },
    content: {
      type: String,
      required: false, // Content is optional if image is present
    },
    image: {
      type: String, // URL from Cloudinary
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model<MessageModel>("Message", MessageSchema);
