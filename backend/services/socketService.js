import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/userSchema.js";
import logger from "../utils/logger.js";

let io;

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, cookie) => {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (!rawKey) return cookies;
    cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});

const getAllowedOrigins = () => {
  const configuredOrigins = env.FRONTEND_URL
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const developmentOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
  ];

  return env.NODE_ENV === "production"
    ? configuredOrigins
    : [...configuredOrigins, ...developmentOrigins];
};

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.accessToken || cookies.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, env.JWT_SECRET_KEY);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("Unauthorized"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);
    logger.info("Socket connected.", { userId: socket.user._id.toString() });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected.", { userId: socket.user._id.toString() });
    });
  });

  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
};
