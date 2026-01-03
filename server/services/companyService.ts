import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { CompanyModel } from "../models/companyModel";
import { CompanyRepository } from "../repositories/companyRepository";

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  async getCompany(id: string): Promise<CompanyModel | null> {
    const company = await this.companyRepository.getCompany(id);
    if (!company) {
      throw new AppError("Company not found", 404);
    }
    return company;
  }

  async getCompanies(): Promise<CompanyModel[]> {
    return this.companyRepository.getCompanies();
  }

  async createCompany(data: Partial<CompanyModel>) {
    if (!data) {
      throw new AppError("Company data are required", 400);
    }

    return await this.companyRepository.createCompany(data);
  }

  async updateCompany(updateData: Partial<CompanyModel>): Promise<CompanyModel | null> {
    if (!updateData._id) {
      throw new AppError("Company ID is required", 400);
    }

    // Check if company exists first
    const existing = await this.companyRepository.getCompany(updateData._id);
    if (!existing) {
      throw new AppError("Company not found", 404);
    }

    const company = await this.companyRepository.updateCompany(updateData._id, updateData);
    return company;
  }

  async deleteCompany(id: string): Promise<CompanyModel | null> {
    const company = await this.companyRepository.deleteCompany(id);
    if (!company) {
      throw new AppError("Company not found", 404);
    }
    return company;
  }

  async searchCompany(query: FilterQuery<CompanyModel>): Promise<CompanyModel | null> {
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<CompanyModel>);

    const company = await this.companyRepository.searchCompany(caseInsensitiveQuery);
    if (!company) {
      throw new AppError("Company not found", 404);
    }
    return company;
  }
}
