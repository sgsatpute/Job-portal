import {
  createAccessToken,
  createRefreshSession,
  setAuthCookies,
} from "../services/tokenService.js";

export const sendToken = async (user, statusCode, res, message, req) => {
  const accessToken = createAccessToken(user);
  const { refreshToken } = await createRefreshSession(user, req);
  const userPayload = user.toObject ? user.toObject() : { ...user };
  delete userPayload.password;

  setAuthCookies(res, accessToken, refreshToken).status(statusCode).json({
    success: true,
    user: userPayload,
    message,
  });
};
