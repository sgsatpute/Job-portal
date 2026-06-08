import express from "express";
import {
  getSavedJobIds,
  getSavedJobs,
  saveJob,
  unsaveJob,
} from "../controllers/savedJobController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isAuthenticated, getSavedJobs);
router.get("/ids", isAuthenticated, getSavedJobIds);
router.post("/:jobId", isAuthenticated, saveJob);
router.delete("/:jobId", isAuthenticated, unsaveJob);

export default router;
