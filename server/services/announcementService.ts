import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { AnnouncementModel } from "../models/announcementModel";
import { AnnouncementRepository } from "../repositories/announcementRepository";
import { EmailService } from "./emailService";

export class AnnouncementService {
  private announcementRepository: AnnouncementRepository;
  private emailService: EmailService;

  constructor() {
    this.announcementRepository = new AnnouncementRepository();
    this.emailService = new EmailService();
  }

  async getAnnouncement(id: string): Promise<AnnouncementModel | null> {
    const announcement = await this.announcementRepository.getAnnouncement(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcement;
  }

  async getAnnouncements(): Promise<AnnouncementModel[]> {
    return this.announcementRepository.getAnnouncements();
  }

  async getAnnouncementsForUser(userProgram?: string): Promise<AnnouncementModel[]> {
    return this.announcementRepository.getAnnouncementsForProgram(userProgram);
  }

  async createAnnouncement(data: Partial<AnnouncementModel>, coordinatorId?: string) {
    if (!data) {
      throw new AppError("Announcement data are required", 400);
    }

    const announcement = await this.announcementRepository.createAnnouncement(data);

    // Send email notifications to students if coordinator created the announcement
    if (announcement && coordinatorId) {
      try {
        await this.emailService.sendAnnouncementNotificationToStudents(announcement, coordinatorId);
      } catch (error) {
        console.error("Failed to send announcement email notifications:", error);
        // Don't throw error to avoid breaking the announcement creation
      }
    }

    return announcement;
  }

  async updateAnnouncement(
    updateData: Partial<AnnouncementModel>
  ): Promise<AnnouncementModel | null> {
    if (!updateData._id) {
      throw new AppError("Announcement ID is required", 400);
    }

    // Check if announcement exists first
    const existing = await this.announcementRepository.getAnnouncement(updateData._id);
    if (!existing) {
      throw new AppError("Announcement not found", 404);
    }

    const announcement = await this.announcementRepository.updateAnnouncement(
      updateData._id,
      updateData
    );
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<AnnouncementModel | null> {
    const announcement = await this.announcementRepository.deleteAnnouncement(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcement;
  }

  async searchAnnouncement(
    query: FilterQuery<AnnouncementModel>
  ): Promise<AnnouncementModel | null> {
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<AnnouncementModel>);

    const announcement = await this.announcementRepository.searchAnnouncement(caseInsensitiveQuery);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcement;
  }
}
