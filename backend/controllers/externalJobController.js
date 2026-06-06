import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";

const sanitizeQuery = (value, fallback = "") =>
  String(value || fallback)
    .trim()
    .slice(0, 120);

const normalizeAdzunaJob = (job) => ({
  externalId: job.id,
  title: job.title || "Untitled role",
  company: job.company?.display_name || "Company not listed",
  location: job.location?.display_name || "Location not listed",
  category: job.category?.label || "General",
  description: job.description || "",
  redirectUrl: job.redirect_url,
  postedAt: job.created,
  salaryFrom: job.salary_min || null,
  salaryTo: job.salary_max || null,
  source: "Adzuna",
});

export const searchExternalJobs = catchAsyncErrors(async (req, res, next) => {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;

  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return next(
      new ErrorHandler(
        "External jobs are not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to backend environment variables.",
        503
      )
    );
  }

  const country = sanitizeQuery(process.env.ADZUNA_COUNTRY, "in").toLowerCase();
  const search = sanitizeQuery(req.query.search, "software developer");
  const location = sanitizeQuery(req.query.location, "");
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: search,
    results_per_page: String(limit),
  });

  if (location) {
    params.set("where", location);
  }

  const endpoint = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params.toString()}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return next(
      new ErrorHandler(
        `External jobs provider returned ${response.status}. Check Adzuna credentials and country code.`,
        502
      )
    );
  }

  const data = await response.json();
  const totalResults = Number(data.count) || 0;

  res.status(200).json({
    success: true,
    source: "Adzuna",
    jobs: Array.isArray(data.results) ? data.results.map(normalizeAdzunaJob) : [],
    pagination: {
      page,
      limit,
      totalJobs: totalResults,
      totalPages: Math.max(Math.ceil(totalResults / limit), 1),
    },
  });
});
