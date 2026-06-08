import { useEffect, useState } from "react";
import { FaBookmark, FaExternalLinkAlt, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";
import { formatDate, formatSalary } from "../../utils/formatters";

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    const fetchSavedJobs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/saved-jobs");
        setSavedJobs(data.savedJobs || []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load saved jobs."));
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, []);

  const removeSavedJob = async (jobId) => {
    setRemovingId(jobId);
    try {
      const { data } = await api.delete(`/saved-jobs/${jobId}`);
      toast.success(data.message);
      setSavedJobs((current) =>
        current.filter((savedJob) => savedJob.job?._id !== jobId)
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to remove saved job."));
    } finally {
      setRemovingId("");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading saved jobs..." />;
  }

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <FaBookmark className="text-brand-700" />
          <h1 className="text-3xl font-bold text-slate-950">Saved Jobs</h1>
        </div>
        <p className="mt-2 text-slate-600">
          Keep interesting roles in one place before applying.
        </p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-slate-600">No saved jobs yet.</p>
          <Link to="/job/getall" className="primary-btn mt-4">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {savedJobs.map((savedJob) => {
            const job = savedJob.job;
            if (!job) return null;

            return (
              <article key={savedJob._id} className="card-surface flex flex-col p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      {job.title}
                    </h2>
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
                  <p>
                    <span className="font-semibold text-slate-800">Saved:</span>{" "}
                    {formatDate(savedJob.createdAt)}
                  </p>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Link to={`/job/${job._id}`} className="primary-btn">
                    <FaExternalLinkAlt />
                    Details
                  </Link>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeSavedJob(job._id)}
                    disabled={removingId === job._id}
                  >
                    <FaTrash />
                    {removingId === job._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default SavedJobs;
