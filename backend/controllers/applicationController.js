import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import cloudinary from "cloudinary";
import validator from "validator";

const APPLICATION_STATUSES = ["Pending", "Shortlisted", "Rejected"];

const validateApplicationFields = ({ name, email, coverLetter, phone, address }) => {
  if (!name || !email || !coverLetter || !phone || !address) {
    return "Please fill all application fields.";
  }
  if (name.trim().length < 3) {
    return "Name must contain at least 3 characters.";
  }
  if (!validator.isEmail(email)) {
    return "Please provide a valid email address.";
  }
  if (!/^[0-9]{10,15}$/.test(String(phone))) {
    return "Phone number must contain 10 to 15 digits.";
  }
  if (coverLetter.trim().length < 20) {
    return "Cover letter must contain at least 20 characters.";
  }
  return null;
};

const uploadPdfResume = async (resume) => {
  if (resume.mimetype !== "application/pdf") {
    throw new ErrorHandler("Only PDF resume files are allowed.", 400);
  }

  if (resume.size > 5 * 1024 * 1024) {
    throw new ErrorHandler("Resume file size must be 5MB or less.", 400);
  }

  const cloudinaryResponse = await cloudinary.v2.uploader.upload(
    resume.tempFilePath,
    {
      folder: "jobportal/applications",
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
  };
};

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employers are not allowed to submit applications.", 403)
    );
  }

  const { name, email, coverLetter, phone, address, jobId } = req.body;
  const validationError = validateApplicationFields(req.body);
  if (validationError) {
    return next(new ErrorHandler(validationError, 400));
  }

  if (!jobId) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  const jobDetails = await Job.findById(jobId);
  if (!jobDetails || jobDetails.expired) {
    return next(new ErrorHandler("Job not found or no longer active.", 404));
  }

  const existingApplication = await Application.findOne({
    jobID: jobDetails._id,
    "applicantID.user": req.user._id,
  });
  if (existingApplication) {
    return next(new ErrorHandler("You have already applied for this job.", 400));
  }

  let resumeToSave = req.user.resume?.url ? req.user.resume : null;
  if (req.files?.resume) {
    resumeToSave = await uploadPdfResume(req.files.resume);
  }

  if (!resumeToSave?.url) {
    return next(new ErrorHandler("Please upload a PDF resume before applying.", 400));
  }

  const application = await Application.create({
    name: name.trim(),
    email,
    coverLetter: coverLetter.trim(),
    phone,
    address: address.trim(),
    jobID: jobDetails._id,
    applicantID: {
      user: req.user._id,
      role: "Job Seeker",
    },
    employerID: {
      user: jobDetails.postedBy,
      role: "Employer",
    },
    resume: resumeToSave,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    application,
  });
});

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job seekers are not allowed to access this resource.", 403)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id })
      .populate("jobID", "title category jobType city country")
      .populate("applicantID.user", "name email phone resume")
      .sort({ appliedAt: -1 });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employers are not allowed to access this resource.", 403)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id })
      .populate("jobID", "title category jobType city country postedBy")
      .populate("employerID.user", "name email")
      .sort({ appliedAt: -1 });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employers are not allowed to access this resource.", 403)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }
    if (application.applicantID.user.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("You can delete only your own applications.", 403));
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);

export const updateApplicationStatus = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Employer") {
    return next(new ErrorHandler("Only employers can update application status.", 403));
  }

  const { id } = req.params;
  const { status } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) {
    return next(new ErrorHandler("Please select a valid application status.", 400));
  }

  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  if (application.employerID.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You can update only your own applications.", 403));
  }

  application.status = status;
  await application.save();

  res.status(200).json({
    success: true,
    message: "Application status updated successfully.",
    application,
  });
});

export const jobseekerDashboard = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Job Seeker") {
    return next(new ErrorHandler("Only job seekers can access this dashboard.", 403));
  }

  const applications = await Application.find({ "applicantID.user": req.user._id })
    .populate("jobID", "title category jobType city country postedBy")
    .populate("employerID.user", "name email")
    .sort({ appliedAt: -1 });

  const statusCounts = APPLICATION_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  applications.forEach((application) => {
    statusCounts[application.status] = (statusCounts[application.status] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    stats: {
      totalApplications: applications.length,
      pending: statusCounts.Pending,
      shortlisted: statusCounts.Shortlisted,
      rejected: statusCounts.Rejected,
    },
    applications,
  });
});
