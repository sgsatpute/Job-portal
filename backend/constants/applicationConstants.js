export const APPLICATION_STATUSES = Object.freeze([
  "Pending",
  "Shortlisted",
  "Rejected",
]);

export const INTERVIEW_MODES = Object.freeze([
  "Video Call",
  "Phone Call",
  "On-site",
]);

export const INTERVIEW_STATUSES = Object.freeze([
  "Not Scheduled",
  "Scheduled",
  "Cancelled",
]);

export const USER_ROLES = Object.freeze({
  JOB_SEEKER: "Job Seeker",
  EMPLOYER: "Employer",
});

export const RESUME_LIMITS = Object.freeze({
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_TEXT_LENGTH: 12000,
});
