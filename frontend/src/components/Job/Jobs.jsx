import { useEffect, useMemo, useState } from "react";
import { FaFilter, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";

const salaryRanges = [
  { value: "all", label: "Any Salary" },
  { value: "0-30000", label: "Below 30,000" },
  { value: "30000-60000", label: "30,000 - 60,000" },
  { value: "60000-100000", label: "60,000 - 100,000" },
  { value: "100000+", label: "Above 100,000" },
];

const getSalaryValue = (job) => {
  if (job.fixedSalary) return Number(job.fixedSalary);
  if (job.salaryFrom && job.salaryTo) {
    return (Number(job.salaryFrom) + Number(job.salaryTo)) / 2;
  }
  return 0;
};

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    jobType: "all",
    location: "all",
    salaryRange: "all",
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get("/job/getall");
        setJobs(data.jobs || []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load jobs."));
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const locations = useMemo(() => {
    const values = jobs
      .map((job) => [job.city, job.country].filter(Boolean).join(", "))
      .filter(Boolean);
    return [...new Set(values)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.title,
        job.category,
        job.description,
        job.city,
        job.country,
        job.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesType =
        filters.jobType === "all" || job.jobType === filters.jobType;
      const jobLocation = [job.city, job.country].filter(Boolean).join(", ");
      const matchesLocation =
        filters.location === "all" || jobLocation === filters.location;
      const salary = getSalaryValue(job);
      const matchesSalary =
        filters.salaryRange === "all" ||
        (filters.salaryRange === "0-30000" && salary < 30000) ||
        (filters.salaryRange === "30000-60000" &&
          salary >= 30000 &&
          salary <= 60000) ||
        (filters.salaryRange === "60000-100000" &&
          salary > 60000 &&
          salary <= 100000) ||
        (filters.salaryRange === "100000+" && salary > 100000);

      return matchesSearch && matchesType && matchesLocation && matchesSalary;
    });
  }, [filters, jobs]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  if (loading) {
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
        {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"} found
      </div>

      {filteredJobs.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-600">
          No jobs match the selected filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
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
              <Link to={`/job/${job._id}`} className="primary-btn mt-6">
                View Details
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Jobs;
