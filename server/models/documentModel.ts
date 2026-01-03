import mongoose, { Document, Schema } from "mongoose";

export interface DocumentsModel extends Document {
  student: Schema.Types.ObjectId;
  documentName: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
  remarks: string;
}

const documentSchema = new Schema<DocumentsModel>({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentName: {
    type: String,
    required: true,
  },
  documents: [
    {
      type: String,
      required: true,
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
  },
});

export const Documents = mongoose.model<DocumentsModel>("Documents", documentSchema);
