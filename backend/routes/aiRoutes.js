import express from "express";
import { generateCareerAdvice } from "../controllers/aiController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/career-advice", isAuthenticated, generateCareerAdvice);

export default router;
