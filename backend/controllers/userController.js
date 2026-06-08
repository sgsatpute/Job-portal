import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import {
  clearAuthCookies,
  revokeRefreshToken,
  rotateRefreshSession,
  setAuthCookies,
} from "../services/tokenService.js";
import validator from "validator";
import {
  destroyResumeAsset,
  uploadPdfResume,
} from "../services/resumeService.js";
import { USER_ROLES } from "../constants/applicationConstants.js";

const validateAuthFields = ({ name, email, phone, password, role }, isRegister) => {
  if (isRegister && (!name || !email || !phone || !password || !role)) {
    return "Please fill the complete registration form.";
  }
  if (!isRegister && (!email || !password || !role)) {
    return "Please provide email, password, and role.";
  }
  if (email && !validator.isEmail(email)) {
    return "Please provide a valid email address.";
  }
  if (isRegister && name.trim().length < 3) {
    return "Name must contain at least 3 characters.";
  }
  if (isRegister && !/^[0-9]{10,15}$/.test(String(phone))) {
    return "Phone number must contain 10 to 15 digits.";
  }
  if (password && password.length < 8) {
    return "Password must contain at least 8 characters.";
  }
  if (!Object.values(USER_ROLES).includes(role)) {
    return "Please select a valid role.";
  }
  return null;
};

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  const validationError = validateAuthFields(req.body, true);
  if (validationError) {
    return next(new ErrorHandler(validationError, 400));
  }
  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered.", 400));
  }
  const user = await User.create({
    name: name.trim(),
    email,
    phone,
    password,
    role,
  });
  await sendToken(user, 201, res, "User registered successfully.", req);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  const validationError = validateAuthFields(req.body, false);
  if (validationError) {
    return next(new ErrorHandler(validationError, 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} role was not found.`, 404)
    );
  }
  user.password = undefined;
  await sendToken(user, 200, res, "User logged in successfully.", req);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  await revokeRefreshToken(req.cookies.refreshToken);

  clearAuthCookies(res).status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  resume: user.resume,
  profile: user.profile,
});

export const refreshAccessToken = catchAsyncErrors(async (req, res, next) => {
  const { user, accessToken, refreshToken } = await rotateRefreshSession(
    req.cookies.refreshToken,
    req
  );

  setAuthCookies(res, accessToken, refreshToken).status(200).json({
    success: true,
    message: "Session refreshed successfully.",
    user: sanitizeUser(user),
  });
});

export const getUser = catchAsyncErrors((req, res, next) => {
  res.status(200).json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, phone, profile = {} } = req.body;
  const update = {};

  if (name !== undefined) {
    if (String(name).trim().length < 3) {
      return next(new ErrorHandler("Name must contain at least 3 characters.", 400));
    }
    update.name = String(name).trim();
  }

  if (phone !== undefined) {
    if (!/^[0-9]{10,15}$/.test(String(phone))) {
      return next(new ErrorHandler("Phone number must contain 10 to 15 digits.", 400));
    }
    update.phone = phone;
  }

  const sanitizedProfile = {
    headline: profile.headline?.trim() || "",
    location: profile.location?.trim() || "",
    companyName: profile.companyName?.trim() || "",
    companyWebsite: profile.companyWebsite?.trim() || "",
    companyDescription: profile.companyDescription?.trim() || "",
    skills: profile.skills?.trim() || "",
    experience: profile.experience?.trim() || "",
    education: profile.education?.trim() || "",
  };

  if (
    sanitizedProfile.companyWebsite &&
    !validator.isURL(sanitizedProfile.companyWebsite, {
      require_protocol: true,
    })
  ) {
    return next(
      new ErrorHandler("Company website must include http:// or https://.", 400)
    );
  }

  update.profile = sanitizedProfile;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      resume: updatedUser.resume,
      profile: updatedUser.profile,
    },
  });
});

export const uploadResume = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== USER_ROLES.JOB_SEEKER) {
    return next(new ErrorHandler("Only job seekers can upload a resume.", 403));
  }

  if (!req.files || !req.files.resume) {
    return next(new ErrorHandler("Please upload a PDF resume.", 400));
  }

  if (req.user.resume?.public_id) {
    await destroyResumeAsset(req.user.resume.public_id);
  }

  const uploadedResume = await uploadPdfResume(
    req.files.resume,
    "jobportal/resumes"
  );

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      resume: {
        public_id: uploadedResume.public_id,
        url: uploadedResume.url,
      },
      resumeText: uploadedResume.text,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Resume uploaded successfully.",
    resume: updatedUser.resume,
    resumeTextLength: uploadedResume.text.length,
  });
});
