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

const router = express.Router();

router.post("/post", isAuthenticated, postApplication);
router.get("/employer/getall", isAuthenticated, employerGetAllApplications);
router.put("/employer/status/:id", isAuthenticated, updateApplicationStatus);
router.get("/jobseeker/dashboard", isAuthenticated, jobseekerDashboard);
router.get("/jobseeker/getall", isAuthenticated, jobseekerGetAllApplications);
router.delete("/delete/:id", isAuthenticated, jobseekerDeleteApplication);

export default router;
