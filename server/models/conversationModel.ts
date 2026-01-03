import mongoose, { Document, Schema } from "mongoose";

export interface ConversationModel extends Document {
    name: string;
    type: "group" | "direct";
    participants: Schema.Types.ObjectId[];
    program?: "bsit" | "bsba";
    admins: Schema.Types.ObjectId[];
    lastMessage?: Schema.Types.ObjectId;
}

const ConversationSchema = new Schema<ConversationModel>(
    {
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["group", "direct"],
            default: "direct",
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        program: {
            type: String,
            enum: ["bsit", "bsba"],
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    { timestamps: true }
);

export const Conversation = mongoose.model<ConversationModel>("Conversation", ConversationSchema);
