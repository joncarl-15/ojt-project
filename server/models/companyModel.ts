import mongoose, { Document, Schema } from "mongoose";

export interface CompanyModel extends Document {
  name: string;
  address: string;
  description?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
}

const CompanySchema = new Schema<CompanyModel>(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    contactPerson: {
      type: String,
      required: true,
      unique: true,
    },
    contactEmail: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model<CompanyModel>("Company", CompanySchema);
