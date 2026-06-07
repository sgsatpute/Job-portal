import { useContext, useEffect, useState } from "react";
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";

const formatSalary = (job) => {
  if (job.fixedSalary) return Number(job.fixedSalary).toLocaleString();
  if (job.salaryFrom && job.salaryTo) {
    return `${Number(job.salaryFrom).toLocaleString()} - ${Number(
      job.salaryTo
    ).toLocaleString()}`;
  }
  return "Not disclosed";
};

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigateTo = useNavigate();
  const { user } = useContext(Context);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data } = await api.get(`/job/${id}`);
        setJob(data.job);
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to load job details."));
        navigateTo("/notfound");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, navigateTo]);

  if (loading) {
    return <LoadingSpinner label="Loading job details..." />;
  }

  if (!job) {
    return null;
  }

  return (
    <main className="page-wrap">
      <button
        type="button"
        onClick={() => navigateTo(-1)}
        className="secondary-btn mb-6"
      >
        <FaArrowLeft />
        Back
      </button>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {job.jobType || "Full-time"}
              </span>
              <h1 className="mt-4 text-3xl font-bold text-slate-950">{job.title}</h1>
              <p className="mt-2 text-slate-600">{job.category}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/ai-assistant"
                state={{ job }}
                className="secondary-btn"
              >
                Ask AI
              </Link>
              {user?.role !== "Employer" && (
                <Link to={`/application/${job._id}`} className="primary-btn">
                  Apply Now
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Description</h2>
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
              {job.description}
            </p>
          </div>

          <aside className="rounded-lg bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-950">Job Summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Company</dt>
                <dd className="mt-1 text-slate-900">{job.postedBy?.name || "Employer"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Location</dt>
                <dd className="mt-1 flex items-center gap-2 text-slate-900">
                  <FaMapMarkerAlt className="text-brand-600" />
                  {[job.city, job.country].filter(Boolean).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Address</dt>
                <dd className="mt-1 text-slate-900">{job.location}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Salary</dt>
                <dd className="mt-1 text-slate-900">{formatSalary(job)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Posted On</dt>
                <dd className="mt-1 flex items-center gap-2 text-slate-900">
                  <FaCalendarAlt className="text-brand-600" />
                  {job.jobPostedOn
                    ? new Date(job.jobPostedOn).toLocaleDateString()
                    : "Recently"}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default JobDetails;
