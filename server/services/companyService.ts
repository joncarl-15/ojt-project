import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { CompanyModel } from "../models/companyModel";
import { CompanyRepository } from "../repositories/companyRepository";

import { UserRepository } from "../repositories/userRepository";

export class CompanyService {
  private companyRepository: CompanyRepository;
  private userRepository: UserRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
    this.userRepository = new UserRepository();
  }

  async getCompany(id: string): Promise<CompanyModel | null> {
    const company = await this.companyRepository.getCompany(id);
    if (!company) {
      throw new AppError("Company not found", 404);
    }
    return company;
  }

  async getCompanies(): Promise<any[]> {
    const companies = await this.companyRepository.getCompanies();
    const counts = await this.userRepository.getInternCountsByCompany();

    // Map counts for O(1) access
    const countMap = counts.reduce((acc, curr) => {
      acc[curr._id.toString()] = { total: curr.total, active: curr.active };
      return acc;
    }, {} as Record<string, { total: number; active: number }>);

    // Merge
    return companies.map((company) => {
      const stats = countMap[company._id.toString()] || { total: 0, active: 0 };
      return {
        ...company.toObject(),
        ...stats,
      };
    });
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
