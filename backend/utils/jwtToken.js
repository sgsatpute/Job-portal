import { env } from "../config/env.js";

export const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  const sameSite =
    env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
  const secure =
    env.COOKIE_SECURE || (isProduction && env.COOKIE_SECURE !== false);

  return {
    expires: new Date(
      Date.now() + env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
  };
};

export const sendToken = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  const userPayload = user.toObject ? user.toObject() : { ...user };
  delete userPayload.password;

  res.status(statusCode).cookie("token", token, getCookieOptions()).json({
    success: true,
    user: userPayload,
    message,
  });
};
