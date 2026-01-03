import { Company, CompanyModel } from "../models/companyModel";
import { FilterQuery, UpdateQuery } from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the company model.
export class CompanyRepository {
  // This method returns a company in the database that matches the id.
  async getCompany(id: string): Promise<CompanyModel | null> {
    return Company.findById(id);
  }

  // This method returns all the company in the database.
  async getCompanies(): Promise<CompanyModel[]> {
    return Company.find();
  }

  // This method creates a bew company in the database.
  async createCompany(data: Partial<CompanyModel>): Promise<CompanyModel> {
    return Company.create(data);
  }

  // This method updates a company in the database.
  async updateCompany(id: string, data: Partial<CompanyModel>): Promise<CompanyModel | null> {
    return Company.findByIdAndUpdate(id, data, { new: true });
  }

  // This method deletes a company from the database.
  async deleteCompany(id: string): Promise<CompanyModel | null> {
    return Company.findByIdAndDelete(id);
  }

  // This method searches for a company in the database that matches the query object.
  async searchCompany(query: FilterQuery<CompanyModel>): Promise<CompanyModel | null> {
    return Company.findOne(query);
  }

  async searchAndUpdate(
    query: FilterQuery<CompanyModel>,
    update?: UpdateQuery<CompanyModel>,
    options?: { multi?: boolean }
  ): Promise<CompanyModel | null | { modifiedCount: number }> {
    if (!update) {
      return Company.findOne(query);
    }

    if (options?.multi) {
      const result = await Company.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Company.findOneAndUpdate(query, update, { new: true });
  }
}
