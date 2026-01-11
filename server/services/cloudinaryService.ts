import { cloudinary } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";

export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, folderName: string): Promise<string> {
    try {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Create a sanitized public ID (remove extension as Cloudinary adds it in URL)
      const timestamp = Date.now();
      const originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, "");
      const sanitizedName = originalNameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
      const publicId = `${timestamp}_${sanitizedName}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: `ojt-assets/${folderName}`,
        public_id: publicId,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        access_mode: "public",
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
