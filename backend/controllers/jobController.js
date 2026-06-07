import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { JOB_TYPES } from "../constants/jobConstants.js";
import { USER_ROLES } from "../constants/applicationConstants.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSalaryFilter = (salaryRange) => {
  switch (salaryRange) {
    case "0-30000":
      return {
        $or: [
          { fixedSalary: { $gt: 0, $lt: 30000 } },
          { salaryTo: { $gt: 0, $lt: 30000 } },
        ],
      };
    case "30000-60000":
      return {
        $or: [
          { fixedSalary: { $gte: 30000, $lte: 60000 } },
          { salaryFrom: { $lte: 60000 }, salaryTo: { $gte: 30000 } },
        ],
      };
    case "60000-100000":
      return {
        $or: [
          { fixedSalary: { $gt: 60000, $lte: 100000 } },
          { salaryFrom: { $lte: 100000 }, salaryTo: { $gt: 60000 } },
        ],
      };
    case "100000+":
      return {
        $or: [
          { fixedSalary: { $gt: 100000 } },
          { salaryFrom: { $gt: 100000 } },
          { salaryTo: { $gt: 100000 } },
        ],
      };
    default:
      return {};
  }
};

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const {
    search = "",
    jobType = "all",
    location = "all",
    salaryRange = "all",
  } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 9, 1), 30);
  const skip = (page - 1) * limit;

  const query = { expired: false };
  const trimmedSearch = String(search).trim();

  if (trimmedSearch) {
    const searchRegex = new RegExp(escapeRegex(trimmedSearch), "i");
    query.$or = [
      { title: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
      { city: searchRegex },
      { country: searchRegex },
      { location: searchRegex },
    ];
  }

  if (jobType !== "all") {
    query.jobType = jobType;
  }

  if (location !== "all") {
    const [city, country] = String(location)
      .split(",")
      .map((value) => value.trim());
    if (city) query.city = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (country) query.country = new RegExp(`^${escapeRegex(country)}$`, "i");
  }

  Object.assign(query, buildSalaryFilter(salaryRange));

  const [jobs, totalJobs, activeJobsForFilters] = await Promise.all([
    Job.find(query).sort({ jobPostedOn: -1 }).skip(skip).limit(limit),
    Job.countDocuments(query),
    Job.find({ expired: false }).select("city country"),
  ]);
  const locations = [
    ...new Set(
      activeJobsForFilters
        .map((job) => [job.city, job.country].filter(Boolean).join(", "))
        .filter(Boolean)
    ),
  ].sort();

  res.status(200).json({
    success: true,
    jobs,
    pagination: {
      page,
      limit,
      totalJobs,
      totalPages: Math.max(Math.ceil(totalJobs / limit), 1),
    },
    filters: {
      locations,
    },
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === USER_ROLES.JOB_SEEKER) {
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

  if (!JOB_TYPES.includes(jobType)) {
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
  if (role === USER_ROLES.JOB_SEEKER) {
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
  if (role === USER_ROLES.JOB_SEEKER) {
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
  if (req.body.jobType && !JOB_TYPES.includes(req.body.jobType)) {
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
  if (role === USER_ROLES.JOB_SEEKER) {
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
  if (req.user.role !== USER_ROLES.EMPLOYER) {
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
