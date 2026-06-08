import express from "express";
import {
  login,
  register,
  logout,
  getUser,
  updateProfile,
  uploadResume,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { authRateLimiter } from "../middlewares/security.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validations/requestSchemas.js";

const router = express.Router();

router.post("/register", authRateLimiter, validateRequest(registerSchema), register);
router.post("/login", authRateLimiter, validateRequest(loginSchema), login);
router.get("/logout", logout);
router.get("/getuser", isAuthenticated, getUser);
router.put(
  "/profile",
  isAuthenticated,
  validateRequest(updateProfileSchema),
  updateProfile
);
router.put("/resume", isAuthenticated, uploadResume);

export default router;
