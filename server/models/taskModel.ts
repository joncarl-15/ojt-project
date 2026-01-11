import mongoose, { Document, Schema } from "mongoose";

export interface TaskModel extends Document {
  title: string;
  description: string;
  dueDate: Date;
  createdBy: Schema.Types.ObjectId;
  assignedTo: Schema.Types.ObjectId;
  status: "pending" | "completed";
  submissionProofUrl: string[];
  submissions: {
    student: Schema.Types.ObjectId;
    files: string[];
    submittedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskModel>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    submissionProofUrl: [
      {
        type: String, // Legacy support
        required: false,
      },
    ],
    submissions: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User" },
        files: [String],
        submittedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Task = mongoose.model<TaskModel>("Task", taskSchema);
