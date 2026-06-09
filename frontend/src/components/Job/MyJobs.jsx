import { useEffect, useState } from "react";
import { FaBriefcase, FaCheck, FaEdit, FaRobot, FaTrash } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";
import { JOB_CATEGORIES, JOB_TYPES } from "../../constants/jobOptions";

const TITLE_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 500;

const pickJobPayload = (job) => ({
  title: job.title,
  description: job.description,
  category: job.category,
  jobType: job.jobType || "Full-time",
  country: job.country,
  city: job.city,
  location: job.location,
  fixedSalary: job.fixedSalary || undefined,
  salaryFrom: job.salaryFrom || undefined,
  salaryTo: job.salaryTo || undefined,
  expired: job.expired,
});

const MyJobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobsPosted: 0,
    totalApplicationsReceived: 0,
  });
  const [analytics, setAnalytics] = useState({
    applicationsByStatus: [],
    applicationsPerJob: [],
    applicationTrends: [],
    topSkills: [],
  });
  const [candidateRecommendations, setCandidateRecommendations] = useState({});
  const [recommendationLoading, setRecommendationLoading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingMode, setEditingMode] = useState(null);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/job/employer/dashboard");
      setMyJobs(data.jobs || []);
      setStats(
        data.stats || { totalJobsPosted: 0, totalApplicationsReceived: 0 }
      );
      setAnalytics(
        data.analytics || {
          applicationsByStatus: [],
          applicationsPerJob: [],
          applicationTrends: [],
          topSkills: [],
        }
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load employer dashboard."));
      setMyJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateJob = async (jobId) => {
    const updatedJob = myJobs.find((job) => job._id === jobId);
    try {
      const { data } = await api.put(
        `/job/update/${jobId}`,
        pickJobPayload(updatedJob)
      );
      toast.success(data.message);
      setEditingMode(null);
      fetchDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update job."));
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const { data } = await api.delete(`/job/delete/${jobId}`);
      toast.success(data.message);
      setMyJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
      setStats((current) => ({
        ...current,
        totalJobsPosted: Math.max(current.totalJobsPosted - 1, 0),
      }));
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to delete job."));
    }
  };

  const handleInputChange = (jobId, field, value) => {
    setMyJobs((prevJobs) =>
      prevJobs.map((job) =>
        job._id === jobId ? { ...job, [field]: value } : job
      )
    );
  };

  const loadCandidateRecommendations = async (jobId) => {
    setRecommendationLoading(jobId);
    try {
      const { data } = await api.get(`/recommendations/candidates/${jobId}`);
      setCandidateRecommendations((current) => ({
        ...current,
        [jobId]: data.recommendations || [],
      }));
      toast.success("Candidate ranking generated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to rank candidates."));
    } finally {
      setRecommendationLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading employer dashboard..." />;
  }

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Employer Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Review posted jobs and application volume across all roles.
        </p>
      </div>

      <div className="mb-8 grid gap-5 sm:grid-cols-2">
        <div className="card-surface p-6">
          <p className="text-sm font-semibold text-slate-500">Total Jobs Posted</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {stats.totalJobsPosted}
          </p>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-semibold text-slate-500">
            Total Applications Received
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {stats.totalApplicationsReceived}
          </p>
        </div>
      </div>

      <EmployerAnalytics analytics={analytics} />

      {myJobs.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-600">
          No jobs posted yet.
        </div>
      ) : (
        <div className="space-y-5">
          {myJobs.map((job) => {
            const isEditing = editingMode === job._id;
            return (
              <article key={job._id} className="card-surface p-6">
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700">
                      <FaBriefcase />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        {job.title}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Applications: {job.applicationCount || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateJob(job._id)}
                          className="primary-btn"
                          aria-label="Save job"
                        >
                          <FaCheck />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMode(null)}
                          className="secondary-btn"
                          aria-label="Cancel edit"
                        >
                          <RxCross2 />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingMode(job._id)}
                        className="secondary-btn"
                      >
                        <FaEdit />
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job._id)}
                      className="danger-btn"
                    >
                      <FaTrash />
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => loadCandidateRecommendations(job._id)}
                      className="secondary-btn"
                      disabled={recommendationLoading === job._id}
                    >
                      <FaRobot />
                      {recommendationLoading === job._id ? "Ranking..." : "Rank Candidates"}
                    </button>
                  </div>
                </div>

                {candidateRecommendations[job._id]?.length > 0 && (
                  <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-brand-700">
                      Recommended Candidates
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {candidateRecommendations[job._id].slice(0, 4).map((item) => (
                        <div
                          key={item.application._id}
                          className="rounded-lg bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-950">
                                {item.candidate?.name || item.application.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.candidate?.email || item.application.email}
                              </p>
                            </div>
                            <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
                              {item.score}%
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-600">
                              {item.confidence || "Low"} confidence
                            </span>
                            {item.savedByCandidate && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                                Saved job
                              </span>
                            )}
                            {item.application?.status && (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                                {item.application.status}
                              </span>
                            )}
                          </div>
                          {item.matchingSkills?.length > 0 && (
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
                              {item.matchingSkills.slice(0, 5).join(", ")}
                            </p>
                          )}
                          {item.missingSkills?.length > 0 && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              Missing: {item.missingSkills.slice(0, 4).join(", ")}
                            </p>
                          )}
                          <p className="mt-2 text-sm text-slate-600">
                            {item.reasons?.[0]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <label>
                    <span className="field-label">Title</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={job.title}
                      onChange={(e) =>
                        handleInputChange(job._id, "title", e.target.value)
                      }
                      className="field mt-2"
                      maxLength={TITLE_MAX_LENGTH}
                    />
                  </label>

                  <label>
                    <span className="field-label">Category</span>
                    <select
                      value={job.category}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleInputChange(job._id, "category", e.target.value)
                      }
                      className="field mt-2"
                    >
                      {JOB_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="field-label">Job Type</span>
                    <select
                      value={job.jobType || "Full-time"}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleInputChange(job._id, "jobType", e.target.value)
                      }
                      className="field mt-2"
                    >
                      {JOB_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="field-label">Expired</span>
                    <select
                      value={String(job.expired)}
                      disabled={!isEditing}
                      onChange={(e) =>
                        handleInputChange(
                          job._id,
                          "expired",
                          e.target.value === "true"
                        )
                      }
                      className="field mt-2"
                    >
                      <option value="false">False</option>
                      <option value="true">True</option>
                    </select>
                  </label>

                  <label>
                    <span className="field-label">Country</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={job.country}
                      onChange={(e) =>
                        handleInputChange(job._id, "country", e.target.value)
                      }
                      className="field mt-2"
                    />
                  </label>

                  <label>
                    <span className="field-label">City</span>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={job.city}
                      onChange={(e) =>
                        handleInputChange(job._id, "city", e.target.value)
                      }
                      className="field mt-2"
                    />
                  </label>

                  {job.fixedSalary ? (
                    <label>
                      <span className="field-label">Fixed Salary</span>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={job.fixedSalary}
                        onChange={(e) =>
                          handleInputChange(
                            job._id,
                            "fixedSalary",
                            e.target.value
                          )
                        }
                        className="field mt-2"
                      />
                    </label>
                  ) : (
                    <>
                      <label>
                        <span className="field-label">Salary From</span>
                        <input
                          type="number"
                          disabled={!isEditing}
                          value={job.salaryFrom || ""}
                          onChange={(e) =>
                            handleInputChange(
                              job._id,
                              "salaryFrom",
                              e.target.value
                            )
                          }
                          className="field mt-2"
                        />
                      </label>
                      <label>
                        <span className="field-label">Salary To</span>
                        <input
                          type="number"
                          disabled={!isEditing}
                          value={job.salaryTo || ""}
                          onChange={(e) =>
                            handleInputChange(
                              job._id,
                              "salaryTo",
                              e.target.value
                            )
                          }
                          className="field mt-2"
                        />
                      </label>
                    </>
                  )}
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label>
                    <span className="field-label">Description</span>
                    <textarea
                      rows={5}
                      disabled={!isEditing}
                      value={job.description}
                      onChange={(e) =>
                        handleInputChange(job._id, "description", e.target.value)
                      }
                      className="field mt-2"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />
                  </label>

                  <label>
                    <span className="field-label">Location</span>
                    <textarea
                      rows={5}
                      disabled={!isEditing}
                      value={job.location}
                      onChange={(e) =>
                        handleInputChange(job._id, "location", e.target.value)
                      }
                      className="field mt-2"
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyJobs;

const chartColors = ["#059669", "#2563eb", "#dc2626", "#f59e0b"];

const EmployerAnalytics = ({ analytics }) => {
  const hasCharts =
    analytics.applicationsPerJob.length ||
    analytics.applicationsByStatus.some((item) => item.count > 0) ||
    analytics.applicationTrends.length ||
    analytics.topSkills.length;

  if (!hasCharts) return null;

  return (
    <section className="mb-8 grid gap-5 xl:grid-cols-2">
      <div className="card-surface p-6">
        <h2 className="text-lg font-bold text-slate-950">Applications Per Job</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.applicationsPerJob}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="text-lg font-bold text-slate-950">Hiring Funnel</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analytics.applicationsByStatus}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
              >
                {analytics.applicationsByStatus.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="text-lg font-bold text-slate-950">Application Trends</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.applicationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="text-lg font-bold text-slate-950">Top Skills</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.topSkills} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="skill" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
