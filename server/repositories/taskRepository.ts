import { Task, TaskModel } from "../models/taskModel";
import { FilterQuery, UpdateQuery } from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the task model.
export class TaskRepository {
  // This method returns a task in the database that matches the id.
  async getTask(id: string): Promise<TaskModel | null> {
    return Task.findById(id);
  }

  // This method returns all the task in the database.
  async getTasks(): Promise<TaskModel[]> {
    return Task.find()
      .populate("createdBy", "firstName lastName email") // replace with the fields you want from User
      .populate("assignedTo", "firstName lastName email program"); // include program field for filtering
  }

  // This method returns all tasks for a specific student.
  async getTasksByStudentId(studentId: string): Promise<TaskModel[]> {
    return Task.find({ assignedTo: studentId });
  }

  // This method creates a new task in the database.
  async createTask(data: Partial<TaskModel>): Promise<TaskModel> {
    return Task.create(data);
  }

  // This method updates a task in the database.
  async updateTask(id: string, data: Partial<TaskModel>): Promise<TaskModel | null> {
    return Task.findByIdAndUpdate(id, data, { new: true });
  }

  // This method deletes a task from the database.
  async deleteTask(id: string): Promise<TaskModel | null> {
    return Task.findByIdAndDelete(id);
  }

  // This method searches for a task in the database that matches the query object.
  async searchTask(query: FilterQuery<TaskModel>): Promise<TaskModel | null> {
    return Task.findOne(query);
  }

  // This method adds file URLs to the task's documents array (prevents duplicates)
  async addFilesToSubmissionProof(id: string, documents: string[]): Promise<TaskModel | null> {
    return Task.findByIdAndUpdate(
      id,
      { $addToSet: { submissionProofUrl: { $each: documents } } },
      { new: true }
    );
  }

  // This method removes specific file URLs from the task's documents array
  async removeFilesToSubmissionProof(id: string, documents: string[]): Promise<TaskModel | null> {
    return Task.findByIdAndUpdate(
      id,
      { $pullAll: { submissionProofUrl: documents } },
      { new: true }
    );
  }

  async searchAndUpdate(
    query: FilterQuery<TaskModel>,
    update?: UpdateQuery<TaskModel>,
    options?: { multi?: boolean }
  ): Promise<TaskModel | null | { modifiedCount: number }> {
    if (!update) {
      return Task.findOne(query);
    }

    if (options?.multi) {
      const result = await Task.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Task.findOneAndUpdate(query, update, { new: true });
  }
}
