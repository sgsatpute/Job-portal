import express from "express";
import {
  cancelInterview,
  employerGetAllApplications,
  jobseekerDeleteApplication,
  jobseekerDashboard,
  jobseekerGetAllApplications,
  postApplication,
  scheduleInterview,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  postApplicationSchema,
  scheduleInterviewSchema,
  updateApplicationStatusSchema,
} from "../validations/requestSchemas.js";

const router = express.Router();

router.post(
  "/post",
  isAuthenticated,
  validateRequest(postApplicationSchema),
  postApplication
);
router.get("/employer/getall", isAuthenticated, employerGetAllApplications);
router.put(
  "/employer/status/:id",
  isAuthenticated,
  validateRequest(updateApplicationStatusSchema),
  updateApplicationStatus
);
router.put(
  "/employer/interview/:id",
  isAuthenticated,
  validateRequest(scheduleInterviewSchema),
  scheduleInterview
);
router.put(
  "/employer/interview/:id/cancel",
  isAuthenticated,
  cancelInterview
);
router.get("/jobseeker/dashboard", isAuthenticated, jobseekerDashboard);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

export default router;
