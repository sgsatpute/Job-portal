import express from "express";
import {
  analyzeResume,
  generateCareerAdvice,
  generateCoverLetter,
  generateInterviewQuestions,
  generateJobDescription,
  generateJobMatch,
  generateSkillRoadmap,
  summarizeApplication,
} from "../controllers/aiController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/career-advice", isAuthenticated, generateCareerAdvice);
router.post("/resume-analysis", isAuthenticated, analyzeResume);
router.get("/job-match/:id", isAuthenticated, generateJobMatch);
router.post("/cover-letter/:id", isAuthenticated, generateCoverLetter);
router.get("/interview-questions/:id", isAuthenticated, generateInterviewQuestions);
router.get("/skill-roadmap/:id", isAuthenticated, generateSkillRoadmap);
router.get("/application-summary/:id", isAuthenticated, summarizeApplication);
router.post("/job-description", isAuthenticated, generateJobDescription);

export default router;
