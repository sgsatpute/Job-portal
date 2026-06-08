import app from "./app.js";
import cloudinary from "cloudinary";
import { createServer } from "http";
import { env } from "./config/env.js";
import dbConnection from "./database/dbConnection.js";
import { initQueues } from "./services/queueService.js";
import { initSocketServer } from "./services/socketService.js";
import logger from "./utils/logger.js";

cloudinary.v2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

await dbConnection();
initQueues();

const server = createServer(app);
initSocketServer(server);

server.listen(env.PORT, () => {
  logger.info("Server started.", { port: env.PORT });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection.", { reason });
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception.", {
    message: error.message,
    stack: error.stack,
  });
  server.close(() => process.exit(1));
});
