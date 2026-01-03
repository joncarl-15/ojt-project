import mongoose, { Document, Schema } from "mongoose";

export interface RequirementsModel extends Document {
  name: string;
  program: "bsit" | "bsba";
}

const requirementsSchema = new Schema<RequirementsModel>({
  name: {
    type: String,
    required: true,
  },
  program: {
    type: String,
    required: true,
  },
});

export const Requirements = mongoose.model<RequirementsModel>("Requirements", requirementsSchema);
