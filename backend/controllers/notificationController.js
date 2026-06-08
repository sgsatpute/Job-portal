import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Notification } from "../models/notificationSchema.js";

export const getNotifications = catchAsyncErrors(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
});

export const markNotificationRead = catchAsyncErrors(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true },
    { new: true }
  );

  res.status(200).json({
    success: true,
    notification,
  });
});

export const markAllNotificationsRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: "Notifications marked as read.",
  });
});
