import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import ErrorHandler from "../middlewares/error.js";
import { RefreshToken } from "../models/refreshTokenSchema.js";

const ACCESS_COOKIE_NAMES = ["accessToken", "token"];
const REFRESH_COOKIE_NAME = "refreshToken";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRefreshTokenValue = () => crypto.randomBytes(64).toString("hex");

const getBaseCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  const sameSite = env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax");
  const secure = env.COOKIE_SECURE || (isProduction && env.COOKIE_SECURE !== false);

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
  };
};

const getAccessCookieOptions = () => ({
  ...getBaseCookieOptions(),
  expires: new Date(
    Date.now() + env.ACCESS_TOKEN_COOKIE_EXPIRE_MINUTES * 60 * 1000
  ),
});

const getRefreshCookieOptions = () => ({
  ...getBaseCookieOptions(),
  expires: new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
  ),
});

const getRequestMetadata = (req) => ({
  userAgent: req.get("user-agent")?.slice(0, 500) || "",
  ipAddress: req.ip?.slice(0, 80) || "",
});

export const createAccessToken = (user) =>
  jwt.sign({ id: user._id }, env.JWT_SECRET_KEY, {
    expiresIn: env.ACCESS_TOKEN_EXPIRE,
  });

export const createRefreshSession = async (user, req) => {
  const refreshToken = createRefreshTokenValue();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 * 1000
  );

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    ...getRequestMetadata(req),
  });

  return { refreshToken, tokenHash };
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  ACCESS_COOKIE_NAMES.forEach((cookieName) => {
    res.cookie(cookieName, accessToken, getAccessCookieOptions());
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  return res;
};

export const clearAuthCookies = (res) => {
  const expiredOptions = {
    ...getBaseCookieOptions(),
    expires: new Date(0),
  };

  [...ACCESS_COOKIE_NAMES, REFRESH_COOKIE_NAME].forEach((cookieName) => {
    res.cookie(cookieName, "", expiredOptions);
  });

  return res;
};

export const revokeRefreshToken = async (refreshToken, replacementHash = "") => {
  if (!refreshToken) return;

  await RefreshToken.findOneAndUpdate(
    {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
      replacedByTokenHash: replacementHash,
    }
  );
};

export const rotateRefreshSession = async (refreshToken, req) => {
  if (!refreshToken) {
    throw new ErrorHandler("Refresh token is required.", 401);
  }

  const tokenHash = hashToken(refreshToken);
  const existingSession = await RefreshToken.findOne({ tokenHash })
    .select("+tokenHash +replacedByTokenHash")
    .populate("user");

  if (!existingSession) {
    throw new ErrorHandler("Refresh token is invalid.", 401);
  }

  if (!existingSession.user) {
    existingSession.revokedAt = new Date();
    await existingSession.save();
    throw new ErrorHandler("Refresh token is invalid.", 401);
  }

  if (existingSession.revokedAt) {
    await RefreshToken.updateMany(
      { user: existingSession.user._id, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw new ErrorHandler("Refresh token is invalid.", 401);
  }

  if (existingSession.expiresAt <= new Date()) {
    existingSession.revokedAt = new Date();
    await existingSession.save();
    throw new ErrorHandler("Refresh token has expired.", 401);
  }

  const accessToken = createAccessToken(existingSession.user);
  const { refreshToken: nextRefreshToken, tokenHash: nextTokenHash } =
    await createRefreshSession(existingSession.user, req);

  existingSession.revokedAt = new Date();
  existingSession.replacedByTokenHash = nextTokenHash;
  await existingSession.save();

  return {
    user: existingSession.user,
    accessToken,
    refreshToken: nextRefreshToken,
  };
};
