import express from "express";
import jobRouter from "./routes/jobRoutes.js";
import userRouter from "./routes/userRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import externalJobRouter from "./routes/externalJobRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import recommendationRouter from "./routes/recommendationRoutes.js";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { env } from "./config/env.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import {
  apiRateLimiter,
  csrfProtection,
  sanitizeRequest,
  securityHeaders,
} from "./middlewares/security.js";
import { sendSuccess } from "./utils/apiResponse.js";

const app = express();

const isProduction = env.NODE_ENV === "production";
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
const allowedOrigins = new Set([
  ...configuredOrigins,
  ...(!isProduction ? developmentOrigins : []),
]);

app.set("trust proxy", 1);
app.use(requestLogger);
app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);
app.use(apiRateLimiter);

app.get("/api/v1/health", (req, res) => {
  sendSuccess(res, 200, {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);
app.use(sanitizeRequest);
app.use(csrfProtection);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/application", applicationRouter);
app.use("/api/v1/external-jobs", externalJobRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/recommendations", recommendationRouter);

app.use(errorMiddleware);
export default app;
