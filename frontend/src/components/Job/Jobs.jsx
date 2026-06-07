import { useContext, useEffect, useState } from "react";
import { FaFilter, FaRobot, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";

const salaryRanges = [
  { value: "all", label: "Any Salary" },
  { value: "0-30000", label: "Below 30,000" },
  { value: "30000-60000", label: "30,000 - 60,000" },
  { value: "60000-100000", label: "60,000 - 100,000" },
  { value: "100000+", label: "Above 100,000" },
];

const formatSalary = (job) => {
  if (job.fixedSalary) return Number(job.fixedSalary).toLocaleString();
  if (job.salaryFrom && job.salaryTo) {
    return `${Number(job.salaryFrom).toLocaleString()} - ${Number(
      job.salaryTo
    ).toLocaleString()}`;
  }
  return "Not disclosed";
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [jobMatches, setJobMatches] = useState({});
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    totalJobs: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    jobType: "all",
    location: "all",
    salaryRange: "all",
  });
  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    const controller = new AbortController();
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/job/getall", {
          params: {
            ...filters,
            page,
            limit: pagination.limit,
          },
          signal: controller.signal,
        });
        setJobs(data.jobs || []);
        setLocations(data.filters?.locations || []);
        setPagination(
          data.pagination || {
            page,
            limit: pagination.limit,
            totalJobs: 0,
            totalPages: 1,
          }
        );
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;
        toast.error(getErrorMessage(error, "Unable to load jobs."));
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    const timeoutId = window.setTimeout(fetchJobs, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [filters, page, pagination.limit]);

  useEffect(() => {
    if (!isAuthorized || user?.role !== "Job Seeker" || jobs.length === 0) {
      setJobMatches({});
      return;
    }

    const controller = new AbortController();
    const fetchMatches = async () => {
      setMatchesLoading(true);
      const results = await Promise.allSettled(
        jobs.map((job) =>
          api.get(`/ai/job-match/${job._id}`, {
            signal: controller.signal,
          })
        )
      );
      if (controller.signal.aborted) return;

      const nextMatches = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextMatches[jobs[index]._id] = result.value.data.match;
        }
      });
      setJobMatches(nextMatches);
      setMatchesLoading(false);
    };

    fetchMatches();

    return () => {
      controller.abort();
    };
  }, [isAuthorized, jobs, user?.role]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  if (initialLoad && loading) {
    return <LoadingSpinner label="Loading jobs..." />;
  }

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Available Jobs</h1>
        <p className="mt-2 text-slate-600">
          Search and filter roles in real time by keyword, job type, location,
          and salary.
        </p>
      </div>

      <section className="card-surface mb-8 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="field-label">Search</span>
            <div className="relative mt-2">
              <input
                type="search"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Title, keyword, category..."
                className="field pl-10"
              />
              <FaSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            </div>
          </label>

          <label className="block">
            <span className="field-label">Job Type</span>
            <select
              value={filters.jobType}
              onChange={(e) => updateFilter("jobType", e.target.value)}
              className="field mt-2"
            >
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Location</span>
            <select
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
              className="field mt-2"
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Salary Range</span>
            <select
              value={filters.salaryRange}
              onChange={(e) => updateFilter("salaryRange", e.target.value)}
              className="field mt-2"
            >
              {salaryRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <FaFilter className="text-brand-600" />
        {pagination.totalJobs} job{pagination.totalJobs === 1 ? "" : "s"} found
        {loading && <span className="text-brand-700">Refreshing...</span>}
      </div>

      {jobs.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-600">
          No jobs match the selected filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job._id} className="card-surface flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{job.category}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {job.jobType || "Full-time"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Location:</span>{" "}
                  {[job.city, job.country].filter(Boolean).join(", ")}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Salary:</span>{" "}
                  {formatSalary(job)}
                </p>
              </div>
              {isAuthorized && user?.role === "Job Seeker" && (
                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-700">
                      <FaRobot />
                      AI Match
                    </span>
                    <span className="text-sm font-bold text-slate-950">
                      {matchesLoading && !jobMatches[job._id]
                        ? "Checking..."
                        : jobMatches[job._id]
                          ? `${jobMatches[job._id].matchScore}%`
                          : "Profile needed"}
                    </span>
                  </div>
                  {jobMatches[job._id]?.matchingSkills?.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {jobMatches[job._id].matchingSkills.slice(0, 3).join(", ")}
                    </p>
                  )}
                </div>
              )}
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link to={`/job/${job._id}`} className="primary-btn">
                  View Details
                </Link>
                <Link
                  to="/ai-assistant"
                  state={{ job }}
                  className="secondary-btn"
                >
                  Ask AI
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
          <p className="text-sm font-semibold text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="secondary-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="primary-btn"
              disabled={page >= pagination.totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(current + 1, pagination.totalPages))
              }
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Jobs;
