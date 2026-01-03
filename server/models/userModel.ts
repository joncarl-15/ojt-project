import mongoose, { Document, Schema } from "mongoose";

// Purpose: Define the user model schema
export interface UserModel extends Document {
  userName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  avatar?: string;
  program?: "bsit" | "bsba";
  role: "admin" | "coordinator" | "student";
  metadata?: {
    company?: Schema.Types.ObjectId;
    coordinator?: Schema.Types.ObjectId;
    deploymentDate?: Date;
    status?: "scheduled" | "deployed" | "completed";
  };
}

const UserSchema = new Schema<UserModel>(
  {
    userName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    middleName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    program: {
      type: String,
      enum: ["bsit", "bsba"],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "coordinator", "student"],
      default: "student",
      required: true,
    },
    metadata: {
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
      coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      deploymentDate: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["scheduled", "deployed", "completed"],
        default: "scheduled",
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserModel>("User", UserSchema);
