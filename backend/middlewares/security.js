import rateLimit from "express-rate-limit";
import helmet from "helmet";
import sanitizeHtml from "sanitize-html";
import ErrorHandler from "./error.js";
import { env } from "../config/env.js";

const sanitizeString = (value) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      if (key.startsWith("$") || key.includes(".")) return acc;
      acc[key] = sanitizeObject(item);
      return acc;
    }, {});
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
};

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

export const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key.startsWith("$") || key.includes(".")) {
      delete req.query[key];
      return;
    }
    req.query[key] = sanitizeObject(value);
  });

  next();
};

export const csrfProtection = (req, res, next) => {
  if (!env.ENABLE_CSRF) return next();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return next(new ErrorHandler("Invalid CSRF token.", 403));
  }

  next();
};
