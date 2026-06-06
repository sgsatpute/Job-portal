import express from "express";
import { searchExternalJobs } from "../controllers/externalJobController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/search", isAuthenticated, searchExternalJobs);

export default router;
