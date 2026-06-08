import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.accessToken || req.cookies.token;
  if (!token) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }
  const decoded = jwt.verify(token, env.JWT_SECRET_KEY);

  req.user = await User.findById(decoded.id);
  if (!req.user) {
    return next(new ErrorHandler("User Not Authorized", 401));
  }

  next();
});
