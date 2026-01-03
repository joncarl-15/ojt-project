import { FilterQuery } from "mongoose";
import { AppError } from "../middleware/errorHandler";
import { DocumentsModel } from "../models/documentModel";
import { DocumentsRepository } from "../repositories/documentRepository";

export class DocumentsService {
  private documentRepository: DocumentsRepository;

  constructor() {
    this.documentRepository = new DocumentsRepository();
  }

  async getDocument(id: string): Promise<DocumentsModel | null> {
    const document = await this.documentRepository.getDocument(id);
    if (!document) {
      throw new AppError("Document not found", 404);
    }
    return document;
  }

  async getDocuments(): Promise<DocumentsModel[]> {
    return this.documentRepository.getDocuments();
  }

  async getDocumentsByStudentId(studentId: string): Promise<DocumentsModel[]> {
    if (!studentId) {
      throw new AppError("Student ID is required", 400);
    }
    return this.documentRepository.getDocumentsByStudentId(studentId);
  }

  async createDocument(data: Partial<DocumentsModel>) {
    if (!data) {
      throw new AppError("Documents data are required", 400);
    }

    return await this.documentRepository.createDocument(data);
  }

  async updateDocument(updateData: Partial<DocumentsModel>): Promise<DocumentsModel | null> {
    if (!updateData._id) {
      throw new AppError("Document ID is required", 400);
    }

    // Check if document exists first
    const existingDocument = await this.documentRepository.getDocument(updateData._id);
    if (!existingDocument) {
      throw new AppError("Document not found", 404);
    }

    // Validate status if it's being updated
    if (updateData.status && !["pending", "approved", "rejected"].includes(updateData.status)) {
      throw new AppError("Invalid status value", 400);
    }

    const document = await this.documentRepository.updateDocument(updateData._id, updateData);
    return document;
  }

  async deleteDocument(id: string): Promise<DocumentsModel | null> {
    const document = await this.documentRepository.deleteDocument(id);
    if (!document) {
      throw new AppError("Document not found", 404);
    }
    return document;
  }

  async addFilesToDocument(id: string, documents: string[]): Promise<DocumentsModel | null> {
    if (!id) {
      throw new AppError("Document ID is required", 400);
    }
    if (!documents || documents.length === 0) {
      throw new AppError("Documents are required", 400);
    }

    // Check if document exists first
    const existingDocument = await this.documentRepository.getDocument(id);
    if (!existingDocument) {
      throw new AppError("Document not found", 404);
    }

    return await this.documentRepository.addFilesToDocument(id, documents);
  }

  async removeFilesFromDocument(id: string, documents: string[]): Promise<DocumentsModel | null> {
    if (!id) {
      throw new AppError("Document ID is required", 400);
    }
    if (!documents || documents.length === 0) {
      throw new AppError("Documents are required", 400);
    }

    // Check if document exists first
    const existingDocument = await this.documentRepository.getDocument(id);
    if (!existingDocument) {
      throw new AppError("Document not found", 404);
    }

    return await this.documentRepository.removeFilesFromDocument(id, documents);
  }

  async searchDocument(query: FilterQuery<DocumentsModel>): Promise<DocumentsModel[]> {
    // If query has a 'query' property, use it for multi-field search including student fields
    if ("query" in query && typeof query.query === "string") {
      const searchTerm = query.query;
      const documents = await this.documentRepository.searchDocumentsWithStudent(searchTerm);
      return documents || [];
    }

    // Fallback to original logic for other query types
    const caseInsensitiveQuery = Object.keys(query).reduce((acc, key) => {
      const value = query[key];
      if (typeof value === "string") {
        acc[key] = { $regex: new RegExp(value, "i") };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as FilterQuery<DocumentsModel>);

    const documents = await this.documentRepository.searchDocuments(caseInsensitiveQuery);
    return documents || [];
  }

  async approveDocument(id: string, remarks?: string): Promise<DocumentsModel | null> {
    if (!id) {
      throw new AppError("Document ID is required", 400);
    }

    // Check if document exists first
    const existingDocument = await this.documentRepository.getDocument(id);
    if (!existingDocument) {
      throw new AppError("Document not found", 404);
    }

    // Check if document is already approved
    if (existingDocument.status === "approved") {
      throw new AppError("Document is already approved", 400);
    }

    const updateData: Partial<DocumentsModel> = {
      status: "approved",
      remarks: remarks || "Document approved",
    };

    return await this.documentRepository.updateDocument(id, updateData);
  }

  async disapproveDocument(id: string, remarks: string): Promise<DocumentsModel | null> {
    if (!id) {
      throw new AppError("Document ID is required", 400);
    }

    if (!remarks || remarks.trim() === "") {
      throw new AppError("Remarks are required when disapproving a document", 400);
    }

    // Check if document exists first
    const existingDocument = await this.documentRepository.getDocument(id);
    if (!existingDocument) {
      throw new AppError("Document not found", 404);
    }

    const updateData: Partial<DocumentsModel> = {
      status: "rejected",
      remarks: remarks.trim(),
    };

    return await this.documentRepository.updateDocument(id, updateData);
  }
}
