import cloudinary from "cloudinary";
import fs from "fs/promises";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { RESUME_LIMITS } from "../constants/applicationConstants.js";
import ErrorHandler from "../middlewares/error.js";

export const validatePdfResume = (resume) => {
  if (!resume) {
    throw new ErrorHandler("Please upload a PDF resume.", 400);
  }

  if (resume.mimetype !== "application/pdf") {
    throw new ErrorHandler("Only PDF resume files are allowed.", 400);
  }

  if (resume.size > RESUME_LIMITS.MAX_FILE_SIZE) {
    throw new ErrorHandler("Resume file size must be 5MB or less.", 400);
  }
};

export const extractResumeText = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    const parsedPdf = await pdfParse(buffer);
    return String(parsedPdf.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, RESUME_LIMITS.MAX_TEXT_LENGTH);
  } catch (error) {
    return "";
  }
};

export const uploadPdfResume = async (resume, folder) => {
  validatePdfResume(resume);

  const resumeText = await extractResumeText(resume.tempFilePath);
  const cloudinaryResponse = await cloudinary.v2.uploader.upload(
    resume.tempFilePath,
    {
      folder,
      resource_type: "raw",
      use_filename: true,
      unique_filename: true,
    }
  );

  if (!cloudinaryResponse?.secure_url) {
    throw new ErrorHandler("Failed to upload resume to Cloudinary.", 500);
  }

  return {
    public_id: cloudinaryResponse.public_id,
    url: cloudinaryResponse.secure_url,
    text: resumeText,
  };
};

export const destroyResumeAsset = async (publicId) => {
  if (!publicId) return;

  await cloudinary.v2.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};
