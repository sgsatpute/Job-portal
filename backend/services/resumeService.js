import cloudinary from "cloudinary";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
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

const parseResumeBuffer = async (buffer) => {
  let parser;
  try {
    parser = new PDFParse({ data: buffer });
    const parsedPdf = await parser.getText();
    return String(parsedPdf.text || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, RESUME_LIMITS.MAX_TEXT_LENGTH);
  } catch (error) {
    return "";
  } finally {
    await parser?.destroy?.();
  }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const extractResumeText = async (filePath) => {
  try {
    return parseResumeBuffer(await fs.readFile(filePath));
  } catch (error) {
    return "";
  }
};

const extractUploadedResumeText = async (resume) => {
  if (resume.tempFilePath) {
    const tempText = await extractResumeText(resume.tempFilePath);
    if (tempText) return tempText;

    await wait(150);
    const retryText = await extractResumeText(resume.tempFilePath);
    if (retryText) return retryText;
  }

  if (resume.data?.length) {
    const bufferText = await parseResumeBuffer(resume.data);
    if (bufferText) return bufferText;
  }

  console.warn("[resume] PDF text extraction returned empty", {
    fileName: resume.name,
    size: resume.size,
    hasTempFile: Boolean(resume.tempFilePath),
    hasDataBuffer: Boolean(resume.data?.length),
  });
  return "";
};

export const uploadPdfResume = async (resume, folder) => {
  validatePdfResume(resume);

  const resumeText = await extractUploadedResumeText(resume);
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
