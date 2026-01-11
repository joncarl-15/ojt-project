import multer from "multer";
import { Request } from "express";
import { AppError } from "./errorHandler";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: Function) => {
  // Allow common file types including images
  const allowedTypes = [
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "image/jpeg",
    "image/png",
    "application/xml",
    "text/xml",
  ];

  const isAllowed = allowedTypes.some(
    (type) => file.mimetype.startsWith(type) || file.mimetype === type
  );

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type! Please upload images, PDF, Word, Excel, or text files.",
        400
      ),
      false
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
