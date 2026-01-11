import { cloudinary } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";

export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, folderName: string): Promise<string> {
    try {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Create a sanitized public ID from the original filename
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
      const publicId = `${timestamp}_${sanitizedName}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: `ojt-assets/${folderName}`,
        public_id: publicId,
        use_filename: true,
        unique_filename: false, // We handle uniqueness with timestamp
        overwrite: true,
      });

      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError("Error uploading file to Cloudinary", 500);
    }
  }

  // Keep the old method for backward compatibility
  async uploadImage(file: Express.Multer.File, folderName: string): Promise<string> {
    return this.uploadFile(file, folderName);
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError("Error deleting image from Cloudinary", 500);
    }
  }
}
