import { Notification } from "../models/notificationSchema.js";
import { emitToUser } from "./socketService.js";

export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  data = {},
}) => {
  if (!recipient) return null;

  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    data,
  });

  emitToUser(recipient, "notification:new", notification);
  return notification;
};
