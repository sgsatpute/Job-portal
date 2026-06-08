import { z } from "zod";
import {
  APPLICATION_STATUSES,
  USER_ROLES,
} from "../constants/applicationConstants.js";
import { JOB_TYPES } from "../constants/jobConstants.js";

const trimString = (min = 1, max = 500) =>
  z.string().trim().min(min).max(max);

const optionalTrimString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const phoneSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .pipe(z.string().regex(/^[0-9]{10,15}$/, "Phone number must contain 10 to 15 digits."));

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().positive().optional());

const roleSchema = z.enum(Object.values(USER_ROLES));
const jobTypeSchema = z.enum(JOB_TYPES);
const statusSchema = z.enum(APPLICATION_STATUSES);

export const registerSchema = z.object({
  body: z.object({
    name: trimString(3, 30),
    email: z.string().trim().email(),
    phone: phoneSchema,
    password: z.string().min(8).max(32),
    role: roleSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(32),
    role: roleSchema,
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: optionalTrimString(30),
    phone: phoneSchema.optional(),
    profile: z
      .object({
        headline: optionalTrimString(80),
        location: optionalTrimString(120),
        companyName: optionalTrimString(80),
        companyWebsite: optionalTrimString(160),
        companyDescription: optionalTrimString(500),
        skills: optionalTrimString(900),
        experience: optionalTrimString(1200),
        education: optionalTrimString(500),
      })
      .partial()
      .default({}),
  }),
});

export const getJobsSchema = z.object({
  query: z.object({
    search: optionalTrimString(120),
    jobType: z.union([jobTypeSchema, z.literal("all")]).optional(),
    location: optionalTrimString(160),
    salaryRange: z
      .enum(["all", "0-30000", "30000-60000", "60000-100000", "100000+"])
      .optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(30).optional(),
  }),
});

const jobBodyShape = {
  title: trimString(3, 30),
  description: trimString(30, 500),
  category: trimString(2, 80),
  jobType: jobTypeSchema,
  country: trimString(2, 80),
  city: trimString(2, 80),
  location: trimString(20, 200),
  fixedSalary: optionalNumber,
  salaryFrom: optionalNumber,
  salaryTo: optionalNumber,
  expired: z.boolean().optional(),
};

const validateJobSalary = (data, ctx, requireSalary = true) => {
  const hasFixedSalary = Boolean(data.fixedSalary);
  const hasRange = Boolean(data.salaryFrom || data.salaryTo);

  if (requireSalary) {
    if (!hasFixedSalary && !(data.salaryFrom && data.salaryTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixedSalary"],
        message: "Provide either fixed salary or salary range.",
      });
    }
  }

  if (hasFixedSalary && hasRange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fixedSalary"],
      message: "Cannot provide fixed and ranged salary together.",
    });
  }

  if (data.salaryFrom && data.salaryTo && data.salaryFrom > data.salaryTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["salaryFrom"],
      message: "Salary From cannot be greater than Salary To.",
    });
  }
};

const jobBodySchema = z
  .object(jobBodyShape)
  .superRefine((data, ctx) => validateJobSalary(data, ctx));

export const postJobSchema = z.object({
  body: jobBodySchema,
});

export const updateJobSchema = z.object({
  body: z
    .object(jobBodyShape)
    .partial()
    .superRefine((data, ctx) => validateJobSalary(data, ctx, false)),
});

export const postApplicationSchema = z.object({
  body: z.object({
    name: trimString(3, 30),
    email: z.string().trim().email(),
    coverLetter: trimString(20, 5000),
    phone: phoneSchema,
    address: trimString(3, 300),
    jobId: trimString(1, 80),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: statusSchema,
  }),
});
