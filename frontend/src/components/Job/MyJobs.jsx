import { useEffect, useState } from "react";
import { FaBriefcase, FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
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
  const [loading, setLoading] = useState(true);
  const [editingMode, setEditingMode] = useState(null);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/job/employer/dashboard");
      setMyJobs(data.jobs || []);
      setStats(
        data.stats || { totalJobsPosted: 0, totalApplicationsReceived: 0 }
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
                  </div>
                </div>

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
