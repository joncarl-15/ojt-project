import { Requirements, RequirementsModel } from "../models/requirementsModel";
import { FilterQuery, UpdateQuery } from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the requirements model.
export class RequirementsRepository {
  // This method returns a requirements in the database that matches the id.
  async getRequirement(id: string): Promise<RequirementsModel | null> {
    return Requirements.findById(id);
  }

  // This method returns all the requirements in the database.
  async getRequirements(): Promise<RequirementsModel[]> {
    return Requirements.find();
  }

  // This method creates a bew requirements in the database.
  async createRequirements(data: Partial<RequirementsModel>): Promise<RequirementsModel> {
    return Requirements.create(data);
  }

  // This method updates a requirements in the database.
  async updateRequirements(
    id: string,
    data: Partial<RequirementsModel>
  ): Promise<RequirementsModel | null> {
    return Requirements.findByIdAndUpdate(id, data, { new: true });
  }

  // This method deletes a requirements from the database.
  async deleteRequirements(id: string): Promise<RequirementsModel | null> {
    return Requirements.findByIdAndDelete(id);
  }

  // This method searches for a requirements in the database that matches the query object.
  async searchRequirements(
    query: FilterQuery<RequirementsModel>
  ): Promise<RequirementsModel | null> {
    return Requirements.findOne(query);
  }

  async searchAndUpdate(
    query: FilterQuery<RequirementsModel>,
    update?: UpdateQuery<RequirementsModel>,
    options?: { multi?: boolean }
  ): Promise<RequirementsModel | null | { modifiedCount: number }> {
    if (!update) {
      return Requirements.findOne(query);
    }

    if (options?.multi) {
      const result = await Requirements.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Requirements.findOneAndUpdate(query, update, { new: true });
  }
}
