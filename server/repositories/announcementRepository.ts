import { Announcement, AnnouncementModel } from "../models/announcementModel";
import { FilterQuery, UpdateQuery } from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the announcement model.
export class AnnouncementRepository {
  // This method returns a announcement in the database that matches the id.
  async getAnnouncement(id: string): Promise<AnnouncementModel | null> {
    return Announcement.findById(id);
  }

  // This method returns all the announcement in the database.
  async getAnnouncements(): Promise<AnnouncementModel[]> {
    return Announcement.find();
  }

  // This method returns announcements filtered by program
  async getAnnouncementsForProgram(userProgram?: string): Promise<AnnouncementModel[]> {
    if (!userProgram) {
      // If no program specified, return all announcements
      return Announcement.find().populate("createdBy", "firstName lastName email program role");
    }

    // Return announcements that target 'all' programs or specifically the user's program
    return Announcement.find({
      $or: [{ targetProgram: "all" }, { targetProgram: userProgram }],
    }).populate("createdBy", "firstName lastName email program role");
  }

  // This method creates a bew announcement in the database.
  async createAnnouncement(data: Partial<AnnouncementModel>): Promise<AnnouncementModel> {
    return Announcement.create(data);
  }

  // This method updates a announcement in the database.
  async updateAnnouncement(
    id: string,
    data: Partial<AnnouncementModel>
  ): Promise<AnnouncementModel | null> {
    return Announcement.findByIdAndUpdate(id, data, { new: true });
  }

  // This method deletes a announcement from the database.
  async deleteAnnouncement(id: string): Promise<AnnouncementModel | null> {
    return Announcement.findByIdAndDelete(id);
  }

  // This method searches for a announcement in the database that matches the query object.
  async searchAnnouncement(
    query: FilterQuery<AnnouncementModel>
  ): Promise<AnnouncementModel | null> {
    return Announcement.findOne(query);
  }

  async searchAndUpdate(
    query: FilterQuery<AnnouncementModel>,
    update?: UpdateQuery<AnnouncementModel>,
    options?: { multi?: boolean }
  ): Promise<AnnouncementModel | null | { modifiedCount: number }> {
    if (!update) {
      return Announcement.findOne(query);
    }

    if (options?.multi) {
      const result = await Announcement.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Announcement.findOneAndUpdate(query, update, { new: true });
  }
}
