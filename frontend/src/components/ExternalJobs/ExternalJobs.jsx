import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";

const formatSalary = (job) => {
  if (job.salaryFrom && job.salaryTo) {
    return `${Number(job.salaryFrom).toLocaleString()} - ${Number(
      job.salaryTo
    ).toLocaleString()}`;
  }
  if (job.salaryFrom) return `From ${Number(job.salaryFrom).toLocaleString()}`;
  if (job.salaryTo) return `Up to ${Number(job.salaryTo).toLocaleString()}`;
  return "Not disclosed";
};

const ExternalJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "software developer",
    location: "",
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalJobs: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [setupMessage, setSetupMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchExternalJobs = async () => {
      setLoading(true);
      setSetupMessage("");
      try {
        const { data } = await api.get("/external-jobs/search", {
          params: {
            ...filters,
            page,
            limit: pagination.limit,
          },
          signal: controller.signal,
        });
        setJobs(data.jobs || []);
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
        const message = getErrorMessage(error, "Unable to load external jobs.");
        setSetupMessage(message);
        setJobs([]);
        toast.error(message);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    const timeoutId = window.setTimeout(fetchExternalJobs, 300);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [filters, page, pagination.limit]);

  const updateFilter = (field, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };

  if (initialLoad && loading) {
    return <LoadingSpinner label="Loading external jobs..." />;
  }

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">External Jobs</h1>
        <p className="mt-2 text-slate-600">
          Live listings from an external provider. These are separate from jobs
          posted by employers inside JobPortal.
        </p>
      </div>

      <section className="card-surface mb-8 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="field-label">Keyword</span>
            <div className="relative mt-2">
              <input
                className="field pl-10"
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="software developer"
              />
              <FaSearch className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            </div>
          </label>

          <label>
            <span className="field-label">Location</span>
            <input
              className="field mt-2"
              type="text"
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="Pune, Mumbai, Remote"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              className="secondary-btn w-full"
              onClick={() => {
                setFilters({ search: "software developer", location: "" });
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {setupMessage && (
        <div className="card-surface mb-8 border-amber-200 bg-amber-50 p-5 text-amber-800">
          <p className="font-semibold">External jobs are not ready yet.</p>
          <p className="mt-2 text-sm">{setupMessage}</p>
        </div>
      )}

      <div className="mb-4 text-sm font-semibold text-slate-600">
        {pagination.totalJobs} external job
        {pagination.totalJobs === 1 ? "" : "s"} found
        {loading && <span className="ml-2 text-brand-700">Refreshing...</span>}
      </div>

      {jobs.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-600">
          No external jobs to show.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.externalId} className="card-surface flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{job.company}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {job.source}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Location:</span>{" "}
                  {job.location}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Category:</span>{" "}
                  {job.category}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Salary:</span>{" "}
                  {formatSalary(job)}
                </p>
              </div>

              <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                {job.description.replace(/<[^>]+>/g, " ")}
              </p>

              <a
                href={job.redirectUrl}
                target="_blank"
                rel="noreferrer"
                className="primary-btn mt-6"
              >
                <FaExternalLinkAlt />
                Apply on Source
              </a>
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

export default ExternalJobs;
