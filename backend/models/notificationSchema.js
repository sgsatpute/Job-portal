import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "APPLICATION_SUBMITTED",
      "APPLICATION_SHORTLISTED",
      "APPLICATION_REJECTED",
      "RESUME_UPLOADED",
      "SYSTEM",
    ],
  },
  title: {
    type: String,
    required: true,
    maxLength: 120,
  },
  message: {
    type: String,
    required: true,
    maxLength: 500,
  },
  data: {
    type: Object,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export const Notification = mongoose.model("Notification", notificationSchema);
