import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import ErrorHandler from "../middlewares/error.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ expired: false }).sort({ jobPostedOn: -1 });
  res.status(200).json({
    success: true,
    jobs,
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job seekers are not allowed to post jobs.", 403)
    );
  }
  const {
    title,
    description,
    category,
    jobType,
    country,
    city,
    location,
    fixedSalary,
    salaryFrom,
    salaryTo,
  } = req.body;

  if (!title || !description || !category || !jobType || !country || !city || !location) {
    return next(new ErrorHandler("Please provide full job details.", 400));
  }

  if (!["Full-time", "Part-time", "Internship"].includes(jobType)) {
    return next(new ErrorHandler("Please select a valid job type.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot enter fixed and ranged salary together.", 400)
    );
  }

  if (salaryFrom && salaryTo && Number(salaryFrom) > Number(salaryTo)) {
    return next(new ErrorHandler("Salary From cannot be greater than Salary To.", 400));
  }

  const postedBy = req.user._id;
  const job = await Job.create({
    title: title.trim(),
    description: description.trim(),
    category,
    jobType,
    country,
    city,
    location: location.trim(),
    fixedSalary,
    salaryFrom,
    salaryTo,
    postedBy,
  });
  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job seekers are not allowed to access this resource.", 403)
    );
  }
  const myJobs = await Job.find({ postedBy: req.user._id }).sort({
    jobPostedOn: -1,
  });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job seekers are not allowed to access this resource.", 403)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You can update only your own jobs.", 403));
  }
  if (req.body.jobType && !["Full-time", "Part-time", "Internship"].includes(req.body.jobType)) {
    return next(new ErrorHandler("Please select a valid job type.", 400));
  }
  if (
    req.body.salaryFrom &&
    req.body.salaryTo &&
    Number(req.body.salaryFrom) > Number(req.body.salaryTo)
  ) {
    return next(new ErrorHandler("Salary From cannot be greater than Salary To.", 400));
  }
  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job seekers are not allowed to access this resource.", 403)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("You can delete only your own jobs.", 403));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await Job.findById(id).populate("postedBy", "name email");
  if (!job) {
    return next(new ErrorHandler("Job not found.", 404));
  }
  res.status(200).json({
    success: true,
    job,
  });
});

export const getEmployerDashboard = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== "Employer") {
    return next(new ErrorHandler("Only employers can access this dashboard.", 403));
  }

  const jobs = await Job.find({ postedBy: req.user._id }).sort({
    jobPostedOn: -1,
  });
  const jobIds = jobs.map((job) => job._id);
  const applicationCounts = await Application.aggregate([
    { $match: { jobID: { $in: jobIds } } },
    { $group: { _id: "$jobID", count: { $sum: 1 } } },
  ]);
  const totalApplicationsReceived = await Application.countDocuments({
    "employerID.user": req.user._id,
  });
  const countByJobId = applicationCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    stats: {
      totalJobsPosted: jobs.length,
      totalApplicationsReceived,
    },
    jobs: jobs.map((job) => ({
      ...job.toObject(),
      applicationCount: countByJobId[job._id.toString()] || 0,
    })),
  });
});
