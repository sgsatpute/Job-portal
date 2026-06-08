import express from "express";
import {
  getRecommendedCandidates,
  getRecommendedJobs,
} from "../controllers/recommendationController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/jobs", isAuthenticated, getRecommendedJobs);
router.get("/candidates/:jobId", isAuthenticated, getRecommendedCandidates);

export default router;
