import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { USER_ROLES } from "../constants/applicationConstants.js";
import { env } from "../config/env.js";
const userSchema = new mongoose.Schema({
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
  phone: {
    type: Number,
    required: [true, "Please enter your Phone Number!"],
  },
  password: {
    type: String,
    required: [true, "Please provide a Password!"],
    minLength: [8, "Password must contain at least 8 characters!"],
    maxLength: [32, "Password cannot exceed 32 characters!"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Please select a role"],
    enum: Object.values(USER_ROLES),
  },
  resume: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  resumeText: {
    type: String,
    maxLength: [12000, "Resume text cannot exceed 12000 characters!"],
    select: false,
  },
  profile: {
    headline: {
      type: String,
      maxLength: [80, "Headline cannot exceed 80 characters!"],
    },
    location: {
      type: String,
      maxLength: [120, "Location cannot exceed 120 characters!"],
    },
    companyName: {
      type: String,
      maxLength: [80, "Company name cannot exceed 80 characters!"],
    },
    companyWebsite: {
      type: String,
      maxLength: [160, "Company website cannot exceed 160 characters!"],
    },
    companyDescription: {
      type: String,
      maxLength: [500, "Company description cannot exceed 500 characters!"],
    },
    skills: {
      type: String,
      maxLength: [900, "Skills cannot exceed 900 characters!"],
    },
    experience: {
      type: String,
      maxLength: [1200, "Experience cannot exceed 1200 characters!"],
    },
    education: {
      type: String,
      maxLength: [500, "Education cannot exceed 500 characters!"],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, env.JWT_SECRET_KEY, {
    expiresIn: env.ACCESS_TOKEN_EXPIRE,
  });
};

export const User = mongoose.model("User", userSchema);
