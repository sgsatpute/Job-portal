import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const currentDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDir, "../config/config.env") });
config({ path: resolve(currentDir, "../.env") });
config();

const booleanFromString = (fallback) =>
  z
    .enum(["true", "false"])
    .default(String(fallback))
    .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  DB_URL: z.string().min(1, "DB_URL is required."),
  DB_NAME: z.string().min(1).default("Job_Portal"),
  JWT_SECRET_KEY: z.string().min(16, "JWT_SECRET_KEY must be at least 16 chars."),
  JWT_EXPIRE: z.string().default("7d"),
  COOKIE_EXPIRE: z.coerce.number().int().positive().default(7),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  COOKIE_SECURE: booleanFromString(false),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  ADZUNA_COUNTRY: z.string().default("in"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  ENABLE_CSRF: booleanFromString(false),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid backend environment variables:");
  console.error(
    parsedEnv.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
  );
  process.exit(1);
}

export const env = parsedEnv.data;
