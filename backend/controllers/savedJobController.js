import mongoose from "mongoose";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { USER_ROLES } from "../constants/applicationConstants.js";
import { Job } from "../models/jobSchema.js";
import { SavedJob } from "../models/savedJobSchema.js";

const ensureJobSeeker = (req, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    next(new ErrorHandler("Only job seekers can manage saved jobs.", 403));
    return false;
  }
  return true;
};

const validateJobId = (jobId, next) => {
  if (!mongoose.isValidObjectId(jobId)) {
    next(new ErrorHandler("Please provide a valid job id.", 400));
    return false;
  }
  return true;
};

const populateSavedJob = (query) =>
  query.populate(
    "job",
    "title category jobType city country fixedSalary salaryFrom salaryTo jobPostedOn expired"
  );

export const getSavedJobs = catchAsyncErrors(async (req, res, next) => {
  if (!ensureJobSeeker(req, next)) return;

  const savedJobs = await populateSavedJob(
    SavedJob.find({ user: req.user._id }).sort({ createdAt: -1 })
  );

  res.status(200).json({
    success: true,
    savedJobs: savedJobs.filter((savedJob) => savedJob.job),
  });
});

export const getSavedJobIds = catchAsyncErrors(async (req, res, next) => {
  if (!ensureJobSeeker(req, next)) return;

  const savedJobs = await SavedJob.find({ user: req.user._id }).select("job");

  res.status(200).json({
    success: true,
    jobIds: savedJobs.map((savedJob) => savedJob.job.toString()),
  });
});

export const saveJob = catchAsyncErrors(async (req, res, next) => {
  if (!ensureJobSeeker(req, next)) return;

  const { jobId } = req.params;
  if (!validateJobId(jobId, next)) return;

  const job = await Job.findOne({ _id: jobId, expired: false });
  if (!job) {
    return next(new ErrorHandler("Job not found or no longer active.", 404));
  }

  const savedJob = await populateSavedJob(
    SavedJob.findOneAndUpdate(
      { user: req.user._id, job: jobId },
      { user: req.user._id, job: jobId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
  );

  res.status(200).json({
    success: true,
    message: "Job saved successfully.",
    savedJob,
  });
});

export const unsaveJob = catchAsyncErrors(async (req, res, next) => {
  if (!ensureJobSeeker(req, next)) return;

  const { jobId } = req.params;
  if (!validateJobId(jobId, next)) return;

  await SavedJob.deleteOne({ user: req.user._id, job: jobId });

  res.status(200).json({
    success: true,
    message: "Job removed from saved jobs.",
  });
});
