export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSite =
    process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" && isProduction);

  return {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
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
