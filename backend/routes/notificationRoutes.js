import express from "express";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isAuthenticated, getNotifications);
router.put("/read-all", isAuthenticated, markAllNotificationsRead);
router.put("/:id/read", isAuthenticated, markNotificationRead);

export default router;
