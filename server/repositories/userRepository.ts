import { User, UserModel } from "../models/userModel";
import { FilterQuery, UpdateQuery } from "mongoose";
import mongoose from "mongoose";

// Purpose: This file is responsible for handling all the database operations related to the user model.
export class UserRepository {
  // This method returns a user in the database that matches the id.
  async getUser(id: string): Promise<UserModel | null> {
    return User.findById(id);
  }

  // This method returns all the user in the database (excluding archived).
  async getUsers(query: FilterQuery<UserModel> = {}): Promise<UserModel[]> {
    // Merge explicit query with archive filter
    const finalQuery = { ...query, isArchived: { $ne: true } };
    return await User.find(finalQuery).populate([
      { path: "metadata.company" },
      { path: "metadata.coordinator" },
    ]);
  }

  // This method creates a bew user in the database.
  async createUser(userData: Partial<UserModel>): Promise<UserModel> {
    return User.create(userData);
  }

  // This method updates a user in the database.
  async updateUser(id: string, userData: Partial<UserModel>): Promise<UserModel | null> {
    return User.findByIdAndUpdate(id, userData, { new: true });
  }

  // This method soft deletes a user from the database.
  async deleteUser(id: string): Promise<UserModel | null> {
    const user = await User.findById(id);
    if (!user) return null;

    return User.findByIdAndUpdate(
      id,
      {
        isArchived: true,
        archivedAt: new Date(),
        // Mangle email and username to free them up for reuse
        email: `${user.email}.archived.${Date.now()}`,
        userName: `${user.userName}.archived.${Date.now()}`
      },
      { new: true }
    );
  }

  // Restore an archived user
  async restoreUser(id: string): Promise<UserModel | null> {
    const user = await User.findById(id);
    if (!user) return null;

    // Try to restore original email/username by stripping the suffix
    const originalEmail = user.email.split('.archived.')[0];
    const originalUserName = user.userName.split('.archived.')[0];

    // Check if original email is taken (by an active user)
    const emailTaken = await User.findOne({ email: originalEmail, isArchived: { $ne: true } });

    // If taken, we can't fully restore the email, we might need to keep it mangled or throw error.
    // Ideally we should probably throw an error if we can't restore? 
    // Or just restore as archived? No, restore means make active.
    // Let's just restore the flags for now and let the user manually fix the email if they want, 
    // OR we can try to restore if not taken.

    const updateData: any = { isArchived: false, archivedAt: null };
    if (!emailTaken) {
      updateData.email = originalEmail;
      updateData.userName = originalUserName;
    }

    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  // Permanently delete a user
  async permanentDeleteUser(id: string): Promise<UserModel | null> {
    return User.findByIdAndDelete(id);
  }

  // Get archived users with optional filter
  async getArchivedUsers(filter: FilterQuery<UserModel> = {}): Promise<UserModel[]> {
    const query = { ...filter, isArchived: true };
    return await User.find(query).populate([
      { path: "metadata.company" },
      { path: "metadata.coordinator" },
    ]);
  }

  // This method searches for user(s) in the database that match the query object.
  async searchUser(
    query: FilterQuery<UserModel>,
    options?: { multiple?: boolean; populate?: boolean }
  ): Promise<UserModel | UserModel[] | null> {
    const { multiple = false, populate = false } = options || {};

    // By default exclude archived users unless explicitly querying for them
    if (query.isArchived === undefined) {
      query.isArchived = { $ne: true };
    }

    if (multiple) {
      const populateOptions = populate
        ? [{ path: "metadata.company" }, { path: "metadata.coordinator" }]
        : [];
      const results = await User.find(query).populate(populateOptions);
      return results; // This will be UserModel[]
    } else {
      const result = await User.findOne(query);
      return result; // This will be UserModel | null
    }
  }

  // Method overloads for better type safety
  async searchAndUpdate(query: FilterQuery<UserModel>): Promise<UserModel | null>;
  async searchAndUpdate(
    query: FilterQuery<UserModel>,
    update: UpdateQuery<UserModel>,
    options: { multi: true }
  ): Promise<{ modifiedCount: number }>;
  async searchAndUpdate(
    query: FilterQuery<UserModel>,
    update: UpdateQuery<UserModel>,
    options?: { multi?: false }
  ): Promise<UserModel | null>;
  async searchAndUpdate(
    query: FilterQuery<UserModel>,
    update?: UpdateQuery<UserModel>,
    options?: { multi?: boolean }
  ): Promise<UserModel | null | { modifiedCount: number }> {
    // If update is not provided, it simply searches for a user in the database. It returns the user if found, or null if not.
    if (!update) {
      return User.findOne(query);
    }

    // If update is provided, it checks if the multi option is specified in the options object. If multi is true, it updated all users in the database that match the query with the update. It returns an object with the modifiedCount property, which indicated the number of documents that were modified.
    if (options?.multi) {
      const result = await User.updateMany(query, update);
      return { modifiedCount: result.modifiedCount };
    }

    // If multi is not specified or is false, it updates the first user in the database that matches the query with the update. It returns the updated user.
    return User.findOneAndUpdate(query, update, { new: true });
  }

  async userDashboard(userId: string, userRole: string, program?: "bsit" | "bsba"): Promise<any> {
    const dashboard = await User.aggregate([
      {
        $facet: {
          // For Student Dashboard
          studentDashboard: [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(userId),
                role: "student",
              },
            },
            {
              $lookup: {
                from: "announcements",
                pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
                as: "announcements",
              },
            },
            {
              $lookup: {
                from: "tasks",
                localField: "_id",
                foreignField: "assignedTo",
                as: "tasks",
              },
            },
            {
              $project: {
                totalAnnouncements: { $size: "$announcements" },
                totalTasks: { $size: "$tasks" },
                userRole: "$role",
              },
            },
          ],

          // For Coordinator Dashboard
          coordinatorDashboard: [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(userId),
                role: "coordinator",
              },
            },
            {
              $lookup: {
                from: "announcements",
                pipeline: [
                  {
                    $match: {
                      createdBy: new mongoose.Types.ObjectId(userId),
                    },
                  },
                ],
                as: "announcements",
              },
            },
            // Logic change: If program is provided, fetch ALL students of that program.
            // If strictly "assigned students", we use metadata.coordinator match.
            // User request: "coordinator can only view its assigned student like BSIT only"
            // AND "when creating student... automatically create BSIT... automaticall create BSBA"
            // This implies Coordinators MANAGE a program.
            {
              $lookup: {
                from: "users",
                pipeline: [
                  {
                    $match: {
                      role: "student",
                      isArchived: { $ne: true },
                      ...(program ? { program: program } : { "metadata.coordinator": new mongoose.Types.ObjectId(userId) })
                    }
                  }
                ],
                as: "studentsHandled",
              },
            },
            {
              $lookup: {
                from: "users",
                pipeline: [
                  {
                    $match: {
                      role: "student",
                      isArchived: { $ne: true },
                      ...(program ? { program: program } : { "metadata.coordinator": new mongoose.Types.ObjectId(userId) })
                    },
                  },
                  {
                    $lookup: {
                      from: "companies",
                      localField: "metadata.company",
                      foreignField: "_id",
                      as: "company",
                    },
                  },
                  {
                    $unwind: {
                      path: "$company",
                      preserveNullAndEmptyArrays: true,
                    },
                  },
                ],
                as: "studentsWithCompanies",
              },
            },
            {
              $project: {
                totalAnnouncements: { $size: "$announcements" },
                totalStudentsHandled: { $size: "$studentsHandled" },
                bsitStudents: {
                  $size: {
                    $filter: {
                      input: "$studentsHandled",
                      cond: { $eq: ["$$this.program", "bsit"] },
                    },
                  },
                },
                bsbaStudents: {
                  $size: {
                    $filter: {
                      input: "$studentsHandled",
                      cond: { $eq: ["$$this.program", "bsba"] },
                    },
                  },
                },
                companiesWithStudents: {
                  $size: {
                    $setUnion: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$studentsWithCompanies",
                              cond: { $ne: ["$$this.company", null] },
                            },
                          },
                          in: "$$this.company._id",
                        },
                      },
                      [],
                    ],
                  },
                },
                userRole: "$role",
              },
            },
          ],

          // For Admin Dashboard
          adminDashboard: [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(userId),
                role: "admin",
              },
            },
            {
              $lookup: {
                from: "users",
                pipeline: [{ $match: { role: "student", isArchived: { $ne: true } } }],
                as: "allStudents",
              },
            },
            {
              $lookup: {
                from: "users",
                pipeline: [{ $match: { role: "coordinator", isArchived: { $ne: true } } }],
                as: "allCoordinators",
              },
            },
            {
              $lookup: {
                from: "companies",
                pipeline: [],
                as: "allCompanies",
              },
            },
            {
              $project: {
                totalStudents: { $size: "$allStudents" },
                bsitStudents: {
                  $size: {
                    $filter: {
                      input: "$allStudents",
                      cond: { $eq: ["$$this.program", "bsit"] },
                    },
                  },
                },
                bsbaStudents: {
                  $size: {
                    $filter: {
                      input: "$allStudents",
                      cond: { $eq: ["$$this.program", "bsba"] },
                    },
                  },
                },
                totalCoordinators: { $size: "$allCoordinators" },
                totalCompanies: { $size: "$allCompanies" },
                userRole: "$role",
              },
            },
          ],
        },
      },
      {
        $project: {
          dashboard: {
            $switch: {
              branches: [
                {
                  case: { $eq: [userRole, "student"] },
                  then: { $arrayElemAt: ["$studentDashboard", 0] },
                },
                {
                  case: { $eq: [userRole, "coordinator"] },
                  then: { $arrayElemAt: ["$coordinatorDashboard", 0] },
                },
                {
                  case: { $eq: [userRole, "admin"] },
                  then: { $arrayElemAt: ["$adminDashboard", 0] },
                },
              ],
              default: null,
            },
          },
        },
      },
      {
        $replaceRoot: { newRoot: "$dashboard" },
      },
    ]);
    return dashboard;
  }
}
