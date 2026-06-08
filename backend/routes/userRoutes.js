import express from "express";
import {
  login,
  register,
  logout,
  refreshAccessToken,
  getUser,
  updateProfile,
  uploadResume,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { authRateLimiter } from "../middlewares/security.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validations/requestSchemas.js";

const router = express.Router();

router.post("/register", authRateLimiter, validateRequest(registerSchema), register);
router.post("/login", authRateLimiter, validateRequest(loginSchema), login);
router.post(
  "/password/forgot",
  authRateLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword
);
router.put(
  "/password/reset/:token",
  authRateLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword
);
router.post("/refresh", authRateLimiter, refreshAccessToken);
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
