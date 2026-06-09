import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import validator from "validator";
import {
  APPLICATION_STATUSES,
  USER_ROLES,
} from "../constants/applicationConstants.js";
import { uploadPdfResume } from "../services/resumeService.js";
import { createNotification } from "../services/notificationService.js";
import { enqueueEmail } from "../services/queueService.js";

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

const ensureEmployerOwnsApplication = (application, employerId, actionMessage) => {
  if (!application) {
    throw new ErrorHandler("Application not found.", 404);
  }

  if (application.employerID.user.toString() !== employerId.toString()) {
    throw new ErrorHandler(actionMessage, 403);
  }
};

const getEmployerApplicationById = async (applicationId, employerId, actionMessage, includeNotes = false) => {
  const query = Application.findById(applicationId);
  if (includeNotes) {
    query.select("+employerNotes");
  }

  const application = await query;
  ensureEmployerOwnsApplication(application, employerId, actionMessage);
  return application;
};

const getPopulatedEmployerApplication = (applicationId) =>
  Application.findById(applicationId)
    .select("+employerNotes")
    .populate("jobID", "title category jobType city country")
    .populate("applicantID.user", "name email phone resume")
    .populate("employerNotes.createdBy", "name email");

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === USER_ROLES.EMPLOYER) {
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

  const fullUser = await User.findById(req.user._id).select("+resumeText");
  let resumeTextToSave = fullUser?.resumeText || "";
  let resumeToSave = fullUser?.resume?.url ? fullUser.resume : null;
  if (req.files?.resume) {
    const uploadedResume = await uploadPdfResume(
      req.files.resume,
      "jobportal/applications"
    );
    resumeTextToSave = uploadedResume.text;
    resumeToSave = {
      public_id: uploadedResume.public_id,
      url: uploadedResume.url,
    };
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
      role: USER_ROLES.JOB_SEEKER,
    },
    employerID: {
      user: jobDetails.postedBy,
      role: USER_ROLES.EMPLOYER,
    },
    resume: resumeToSave,
    resumeText: resumeTextToSave,
  });

  await Promise.allSettled([
    createNotification({
      recipient: jobDetails.postedBy,
      type: "APPLICATION_SUBMITTED",
      title: "New application received",
      message: `${application.name} applied for ${jobDetails.title}.`,
      data: {
        applicationId: application._id,
        jobId: jobDetails._id,
      },
    }),
    createNotification({
      recipient: jobDetails.postedBy,
      type: "RESUME_UPLOADED",
      title: "Resume ready for review",
      message: `${application.name}'s resume is attached to the application.`,
      data: {
        applicationId: application._id,
        jobId: jobDetails._id,
      },
    }),
    enqueueEmail({
      to: application.email,
      template: "applicationSubmitted",
      payload: {
        name: application.name,
        jobTitle: jobDetails.title,
      },
    }),
  ]);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    application,
  });
});

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === USER_ROLES.JOB_SEEKER) {
      return next(
        new ErrorHandler("Job seekers are not allowed to access this resource.", 403)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id })
      .select("+employerNotes")
      .populate("jobID", "title category jobType city country")
      .populate("applicantID.user", "name email phone resume")
      .populate("employerNotes.createdBy", "name email")
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
    if (role === USER_ROLES.EMPLOYER) {
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
    if (role === USER_ROLES.EMPLOYER) {
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
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can update application status.", 403));
  }

  const { id } = req.params;
  const { status } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) {
    return next(new ErrorHandler("Please select a valid application status.", 400));
  }

  const application = await getEmployerApplicationById(
    id,
    req.user._id,
    "You can update only your own applications."
  );

  application.status = status;
  await application.save();
  const job = await Job.findById(application.jobID).select("title");
  const notificationType =
    status === "Shortlisted"
      ? "APPLICATION_SHORTLISTED"
      : status === "Rejected"
        ? "APPLICATION_REJECTED"
        : "SYSTEM";

  await Promise.allSettled([
    createNotification({
      recipient: application.applicantID.user,
      type: notificationType,
      title: `Application ${status}`,
      message: `Your application for ${job?.title || "a job"} is now ${status}.`,
      data: {
        applicationId: application._id,
        jobId: application.jobID,
        status,
      },
    }),
    enqueueEmail({
      to: application.email,
      template: "applicationStatus",
      payload: {
        name: application.name,
        jobTitle: job?.title || "your selected role",
        status,
      },
    }),
  ]);

  const populatedApplication = await getPopulatedEmployerApplication(application._id);

  res.status(200).json({
    success: true,
    message: "Application status updated successfully.",
    application: populatedApplication,
  });
});

const formatInterviewDate = (scheduledAt) =>
  new Date(scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const scheduleInterview = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can schedule interviews.", 403));
  }

  const { id } = req.params;
  const { scheduledAt, mode, location, notes = "" } = req.body;
  const application = await getEmployerApplicationById(
    id,
    req.user._id,
    "You can schedule only your own applications."
  );

  if (application.status === "Rejected") {
    return next(new ErrorHandler("Cannot schedule interview for a rejected application.", 400));
  }

  const job = await Job.findById(application.jobID).select("title");
  application.status = "Shortlisted";
  application.interview = {
    scheduledAt,
    mode,
    location: location.trim(),
    notes: notes?.trim() || "",
    status: "Scheduled",
    scheduledBy: req.user._id,
    scheduledOn: new Date(),
    cancelledOn: undefined,
  };
  await application.save();

  await Promise.allSettled([
    createNotification({
      recipient: application.applicantID.user,
      type: "INTERVIEW_SCHEDULED",
      title: "Interview scheduled",
      message: `Your interview for ${job?.title || "a job"} is scheduled on ${formatInterviewDate(
        scheduledAt
      )}.`,
      data: {
        applicationId: application._id,
        jobId: application.jobID,
        scheduledAt,
        mode,
      },
    }),
    enqueueEmail({
      to: application.email,
      template: "interviewScheduled",
      payload: {
        name: application.name,
        jobTitle: job?.title || "your selected role",
        scheduledAt,
        mode,
        location,
      },
    }),
  ]);

  const populatedApplication = await getPopulatedEmployerApplication(application._id);

  res.status(200).json({
    success: true,
    message: "Interview scheduled successfully.",
    application: populatedApplication,
  });
});

export const cancelInterview = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can cancel interviews.", 403));
  }

  const { id } = req.params;
  const application = await getEmployerApplicationById(
    id,
    req.user._id,
    "You can cancel only your own interviews."
  );

  if (application.interview?.status !== "Scheduled") {
    return next(new ErrorHandler("No scheduled interview found for this application.", 400));
  }

  application.interview.status = "Cancelled";
  application.interview.cancelledOn = new Date();
  await application.save();
  const job = await Job.findById(application.jobID).select("title");

  await Promise.allSettled([
    createNotification({
      recipient: application.applicantID.user,
      type: "INTERVIEW_CANCELLED",
      title: "Interview cancelled",
      message: `Your interview for ${job?.title || "a job"} has been cancelled.`,
      data: {
        applicationId: application._id,
        jobId: application.jobID,
      },
    }),
    enqueueEmail({
      to: application.email,
      template: "interviewCancelled",
      payload: {
        name: application.name,
        jobTitle: job?.title || "your selected role",
      },
    }),
  ]);

  const populatedApplication = await getPopulatedEmployerApplication(application._id);

  res.status(200).json({
    success: true,
    message: "Interview cancelled successfully.",
    application: populatedApplication,
  });
});

export const addEmployerNote = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can add candidate notes.", 403));
  }

  const application = await getEmployerApplicationById(
    req.params.id,
    req.user._id,
    "You can add notes only to your own applications.",
    true
  );

  if (application.employerNotes.length >= 25) {
    return next(new ErrorHandler("Maximum 25 notes are allowed per application.", 400));
  }

  application.employerNotes.push({
    note: req.body.note.trim(),
    createdBy: req.user._id,
  });
  await application.save();

  const populatedApplication = await getPopulatedEmployerApplication(application._id);

  res.status(201).json({
    success: true,
    message: "Candidate note added successfully.",
    application: populatedApplication,
  });
});

export const deleteEmployerNote = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(new ErrorHandler("Only employers can delete candidate notes.", 403));
  }

  const application = await getEmployerApplicationById(
    req.params.applicationId,
    req.user._id,
    "You can delete notes only from your own applications.",
    true
  );

  const note = application.employerNotes.id(req.params.noteId);
  if (!note) {
    return next(new ErrorHandler("Candidate note not found.", 404));
  }

  application.employerNotes.pull(req.params.noteId);
  await application.save();

  const populatedApplication = await getPopulatedEmployerApplication(application._id);

  res.status(200).json({
    success: true,
    message: "Candidate note deleted successfully.",
    application: populatedApplication,
  });
});

export const jobseekerDashboard = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
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
