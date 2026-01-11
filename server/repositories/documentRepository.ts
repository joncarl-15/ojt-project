import { Documents, DocumentsModel } from "../models/documentModel";
import { FilterQuery, UpdateQuery } from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the document model.
export class DocumentsRepository {
  // Get a single document by id with student populated
  async getDocument(id: string): Promise<DocumentsModel | null> {
    return Documents.findById(id).populate("student", "firstName lastName email program");
  }

  // Get all documents with student populated (exclude archived)
  async getDocuments(): Promise<DocumentsModel[]> {
    return Documents.find({ isArchived: { $ne: true } }).populate(
      "student",
      "firstName lastName email program"
    );
  }

  // Get all documents for a specific student (exclude archived)
  async getDocumentsByStudentId(studentId: string): Promise<DocumentsModel[]> {
    return Documents.find({ student: studentId, isArchived: { $ne: true } }).populate(
      "student",
      "firstName lastName email program"
    );
  }

  // Create a new document (no need to populate on create)
  async createDocument(data: Partial<DocumentsModel>): Promise<DocumentsModel> {
    return Documents.create(data);
  }

  // Update a document and return populated student
  async updateDocument(id: string, data: Partial<DocumentsModel>): Promise<DocumentsModel | null> {
    return Documents.findByIdAndUpdate(id, data, { new: true }).populate("student");
  }

  // Soft delete a document (no populate needed)
  async deleteDocument(id: string): Promise<DocumentsModel | null> {
    return Documents.findByIdAndUpdate(
      id,
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    );
  }

  // Restore an archived document
  async restoreDocument(id: string): Promise<DocumentsModel | null> {
    return Documents.findByIdAndUpdate(
      id,
      { isArchived: false, archivedAt: null },
      { new: true }
    );
  }

  // Permanently delete a document
  async permanentDeleteDocument(id: string): Promise<DocumentsModel | null> {
    return Documents.findByIdAndDelete(id);
  }

  // Get archived documents
  // Get archived documents with optional program filter
  async getArchivedDocuments(program?: string): Promise<DocumentsModel[]> {
    const pipeline: any[] = [
      { $match: { isArchived: true } },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ];

    if (program) {
      pipeline.push({
        $match: { "student.program": program },
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        documentName: 1,
        documents: 1,
        status: 1,
        remarks: 1,
        uploadedAt: 1,
        isArchived: 1,
        archivedAt: 1,
        student: {
          _id: "$student._id",
          firstName: "$student.firstName",
          lastName: "$student.lastName",
          email: "$student.email",
          program: "$student.program",
        },
      },
    });

    return Documents.aggregate(pipeline);
  }

  // Search one document and populate student
  async searchDocument(query: FilterQuery<DocumentsModel>): Promise<DocumentsModel | null> {
    // By default exclude archived unless explicitly asked
    if (query.isArchived === undefined) {
      query.isArchived = { $ne: true };
    }
    return Documents.findOne(query).populate("student");
  }

  // Search multiple documents and populate student
  async searchDocuments(query: FilterQuery<DocumentsModel>): Promise<DocumentsModel[]> {
    // By default exclude archived unless explicitly asked
    if (query.isArchived === undefined) {
      query.isArchived = { $ne: true };
    }
    return Documents.find(query).populate("student", "firstName lastName email program");
  }

  // Search documents including student fields using aggregation
  async searchDocumentsWithStudent(searchTerm: string): Promise<DocumentsModel[]> {
    return Documents.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $match: {
          isArchived: { $ne: true },
          $or: [
            { documentName: { $regex: new RegExp(searchTerm, "i") } },
            { remarks: { $regex: new RegExp(searchTerm, "i") } },
            { "student.firstName": { $regex: new RegExp(searchTerm, "i") } },
            { "student.lastName": { $regex: new RegExp(searchTerm, "i") } },
            { "student.program": { $regex: new RegExp(searchTerm, "i") } },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ["$student.firstName", " ", "$student.lastName"] },
                  regex: new RegExp(searchTerm, "i"),
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          documentName: 1,
          documents: 1,
          status: 1,
          remarks: 1,
          uploadedAt: 1,
          student: {
            _id: "$student._id",
            firstName: "$student.firstName",
            lastName: "$student.lastName",
            email: "$student.email",
            program: "$student.program",
          },
        },
      },
    ]);
  }

  // Add files to a document and return populated student
  async addFilesToDocument(id: string, documents: string[]): Promise<DocumentsModel | null> {
    return Documents.findByIdAndUpdate(
      id,
      { $addToSet: { documents: { $each: documents } } },
      { new: true }
    ).populate("student");
  }

  // Remove files from a document and return populated student
  async removeFilesFromDocument(id: string, documents: string[]): Promise<DocumentsModel | null> {
    return Documents.findByIdAndUpdate(
      id,
      { $pullAll: { documents: documents } },
      { new: true }
    ).populate("student");
  }

  // Search and update with optional multi-update
  async searchAndUpdate(
    query: FilterQuery<DocumentsModel>,
    update?: UpdateQuery<DocumentsModel>,
    options?: { multi?: boolean }
  ): Promise<DocumentsModel | null | { modifiedCount: number }> {
    if (!update) {
      return Documents.findOne(query).populate("student");
    }

    if (options?.multi) {
      const result = await Documents.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    return Documents.findOneAndUpdate(query, update, { new: true }).populate("student");
  }
  async deleteDocumentsByStudentId(studentId: string): Promise<{ deletedCount: number }> {
    const result = await Documents.deleteMany({ student: studentId });
    return { deletedCount: result.deletedCount };
  }
}
