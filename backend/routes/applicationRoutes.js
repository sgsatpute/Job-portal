import express from "express";
import {
  employerGetAllApplications,
  jobseekerDeleteApplication,
  jobseekerDashboard,
  jobseekerGetAllApplications,
  postApplication,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  postApplicationSchema,
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
router.get("/jobseeker/dashboard", isAuthenticated, jobseekerDashboard);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

export default router;
