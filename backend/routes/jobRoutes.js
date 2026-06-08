import express from "express";
import {
  deleteJob,
  getAllJobs,
  getEmployerDashboard,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getJobsSchema,
  postJobSchema,
  updateJobSchema,
} from "../validations/requestSchemas.js";

const router = express.Router();

router.get("/getall", validateRequest(getJobsSchema), getAllJobs);
router.post("/post", isAuthenticated, validateRequest(postJobSchema), postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.get("/employer/dashboard", isAuthenticated, getEmployerDashboard);
router.put("/update/:id", isAuthenticated, validateRequest(updateJobSchema), updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
router.get("/:id", isAuthenticated, getSingleJob);

export default router;
