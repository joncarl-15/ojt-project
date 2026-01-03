import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { RequirementsModel } from "../models/requirementsModel";
import { RequirementsRepository } from "../repositories/requirementsRepository";

export class RequirementsService {
  private requirementsRepository: RequirementsRepository;

  constructor() {
    this.requirementsRepository = new RequirementsRepository();
  }

  async getRequirement(id: string): Promise<RequirementsModel | null> {
    const requirements = await this.requirementsRepository.getRequirement(id);
    if (!requirements) {
      throw new AppError("Requirements not found", 404);
    }
    return requirements;
  }

  async getRequirements(): Promise<RequirementsModel[]> {
    return this.requirementsRepository.getRequirements();
  }

  async createRequirements(data: Partial<RequirementsModel>) {
    if (!data) {
      throw new AppError("Requirements data are required", 400);
    }

    return await this.requirementsRepository.createRequirements(data);
  }

  async updateRequirements(
    updateData: Partial<RequirementsModel>
  ): Promise<RequirementsModel | null> {
    if (!updateData._id) {
      throw new AppError("Requirements ID is required", 400);
    }

    // Check if requirements exists first
    const existing = await this.requirementsRepository.getRequirement(updateData._id);
    if (!existing) {
      throw new AppError("Requirements not found", 404);
    }

    const requirements = await this.requirementsRepository.updateRequirements(
      updateData._id,
      updateData
    );
    return requirements;
  }

  async deleteRequirements(id: string): Promise<RequirementsModel | null> {
    const requirements = await this.requirementsRepository.deleteRequirements(id);
    if (!requirements) {
      throw new AppError("Requirements not found", 404);
    }
    return requirements;
  }

  async searchRequirements(
    query: FilterQuery<RequirementsModel>
  ): Promise<RequirementsModel | null> {
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<RequirementsModel>);

    const requirements = await this.requirementsRepository.searchRequirements(caseInsensitiveQuery);
    if (!requirements) {
      throw new AppError("Requirements not found", 404);
    }
    return requirements;
  }
}
