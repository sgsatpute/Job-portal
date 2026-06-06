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

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/getuser", isAuthenticated, getUser);
router.put("/profile", isAuthenticated, updateProfile);
router.put("/resume", isAuthenticated, uploadResume);

export default router;
