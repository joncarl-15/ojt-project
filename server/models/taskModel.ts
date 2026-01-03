import mongoose, { Document, Schema } from "mongoose";

export interface TaskModel extends Document {
  title: string;
  description: string;
  dueDate: Date;
  createdBy: Schema.Types.ObjectId;
  assignedTo: Schema.Types.ObjectId;
  status: "pending" | "completed";
  submissionProofUrl: string[];
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
        type: String,
        required: false,
      },
    ],
  },
  { timestamps: true }
);

export const Task = mongoose.model<TaskModel>("Task", taskSchema);
