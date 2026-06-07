import mongoose from "mongoose";
import validator from "validator";
import {
  APPLICATION_STATUSES,
  USER_ROLES,
} from "../constants/applicationConstants.js";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your Name!"],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your Email!"],
    validate: [validator.isEmail, "Please provide a valid Email!"],
  },
  coverLetter: {
    type: String,
    required: [true, "Please provide a cover letter!"],
  },
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  address: {
    type: String,
    required: [true, "Please enter your Address!"],
  },
  resume: {
    public_id: {
      type: String, 
      required: true,
    },
    url: {
      type: String, 
      required: true,
    },
  },
  resumeText: {
    type: String,
    maxLength: [12000, "Resume text cannot exceed 12000 characters!"],
    select: false,
  },
  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: "Pending",
  },
  jobID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  applicantID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: [USER_ROLES.JOB_SEEKER],
      required: true,
    },
  },
  employerID: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: [USER_ROLES.EMPLOYER],
      required: true,
    },
  },
});

export const Application = mongoose.model("Application", applicationSchema);
