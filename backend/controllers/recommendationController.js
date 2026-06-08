import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { USER_ROLES } from "../constants/applicationConstants.js";
import {
  recommendCandidatesForJob,
  recommendJobsForCandidate,
} from "../services/recommendationService.js";

export const getRecommendedJobs = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can view job recommendations.", 403));
  }

  const recommendations = await recommendJobsForCandidate(req.user._id);
  res.status(200).json({
    success: true,
    recommendations,
  });
});

export const getRecommendedCandidates = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.EMPLOYER) {
    return next(
      new ErrorHandler("Only employers can view candidate recommendations.", 403)
    );
  }

  const recommendations = await recommendCandidatesForJob({
    jobId: req.params.jobId,
    employerId: req.user._id,
  });

  if (!recommendations) {
    return next(new ErrorHandler("Job not found.", 404));
  }

  res.status(200).json({
    success: true,
    recommendations,
  });
});
