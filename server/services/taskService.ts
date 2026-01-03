import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { TaskModel } from "../models/taskModel";
import { TaskRepository } from "../repositories/taskRepository";

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  async getTask(id: string): Promise<TaskModel | null> {
    const task = await this.taskRepository.getTask(id);
    if (!task) {
      throw new AppError("Task not found", 404);
    }
    return task;
  }

  async getTasks(): Promise<TaskModel[]> {
    return this.taskRepository.getTasks();
  }

  async getTasksByStudentId(studentId: string): Promise<TaskModel[]> {
    if (!studentId) {
      throw new AppError("Student ID is required", 400);
    }
    return this.taskRepository.getTasksByStudentId(studentId);
  }

  async createTask(data: Partial<TaskModel>) {
    if (!data) {
      throw new AppError("Tasks data are required", 400);
    }

    return await this.taskRepository.createTask(data);
  }

  async updateTask(updateData: Partial<TaskModel>): Promise<TaskModel | null> {
    if (!updateData._id) {
      throw new AppError("Task ID is required", 400);
    }

    // Check if task exists first
    const existingTask = await this.taskRepository.getTask(updateData._id);
    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    // Validate status if it's being updated
    if (updateData.status && !["pending", "completed"].includes(updateData.status)) {
      throw new AppError("Invalid status value", 400);
    }

    const task = await this.taskRepository.updateTask(updateData._id, updateData);
    return task;
  }

  async deleteTask(id: string): Promise<TaskModel | null> {
    const task = await this.taskRepository.deleteTask(id);
    if (!task) {
      throw new AppError("Task not found", 404);
    }
    return task;
  }

  async addFilesToSubmissionProof(id: string, documents: string[]): Promise<TaskModel | null> {
    if (!id) {
      throw new AppError("Task ID is required", 400);
    }
    if (!documents || documents.length === 0) {
      throw new AppError("Documents are required", 400);
    }

    // Check if task exists first
    const existingTask = await this.taskRepository.getTask(id);
    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    return await this.taskRepository.addFilesToSubmissionProof(id, documents);
  }

  async removeFilesToSubmissionProof(id: string, documents: string[]): Promise<TaskModel | null> {
    if (!id) {
      throw new AppError("Task ID is required", 400);
    }
    if (!documents || documents.length === 0) {
      throw new AppError("Documents are required", 400);
    }

    // Check if task exists first
    const existingTask = await this.taskRepository.getTask(id);
    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    return await this.taskRepository.removeFilesToSubmissionProof(id, documents);
  }

  async searchTask(query: FilterQuery<TaskModel>): Promise<TaskModel | null> {
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<TaskModel>);

    const task = await this.taskRepository.searchTask(caseInsensitiveQuery);
    if (!task) {
      throw new AppError("Task not found", 404);
    }
    return task;
  }
}
