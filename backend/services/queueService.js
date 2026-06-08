import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { sendEmail } from "./emailService.js";

let emailQueue;
let emailWorker;

const canUseRedis = () => env.ENABLE_BACKGROUND_JOBS && env.REDIS_URL;

export const initQueues = () => {
  if (!canUseRedis() || emailQueue) return;

  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  emailQueue = new Queue("email", { connection });
  emailWorker = new Worker(
    "email",
    async (job) => {
      await sendEmail(job.data);
    },
    { connection }
  );

  emailWorker.on("failed", (job, error) => {
    logger.error("Email job failed.", {
      jobId: job?.id,
      message: error.message,
    });
  });

  logger.info("Background email queue initialized.");
};

export const enqueueEmail = async (payload) => {
  if (canUseRedis()) {
    initQueues();
    await emailQueue.add("send-email", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
    return;
  }

  setImmediate(() => {
    sendEmail(payload).catch((error) => {
      logger.error("Email send failed.", { message: error.message });
    });
  });
};
