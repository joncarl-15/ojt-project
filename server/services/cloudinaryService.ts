import { cloudinary } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";

export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, folderName: string): Promise<string> {
    try {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      // Create a sanitized public ID
      const timestamp = Date.now();
      // Simple extension removal
      const parts = file.originalname.split('.');
      const ext = parts.length > 1 ? parts.pop() : '';
      const nameWithoutExt = parts.join('.');
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

      // Determine resource type: 'image' for images, 'raw' for everything else (PDFs, docs, etc.)
      const isImage = file.mimetype.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';

      // For raw files, we might want to preserve extension in the public_id so the URL ends with it
      // Cloudinary raw URLs: /raw/upload/v1234/folder/filename.ext
      // Image URLs: /image/upload/v1234/folder/filename (extension implied or added)

      let publicId = `${timestamp}_${sanitizedName}`;
      if (resourceType === 'raw' && ext) {
        publicId += `.${ext}`;
      }

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: resourceType,
        folder: `ojt-assets/${folderName}`,
        public_id: publicId,
        use_filename: false, // Strictly use our public_id
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
