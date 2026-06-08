import { useCallback, useContext, useEffect, useState } from "react";
import { FaExternalLinkAlt, FaFilePdf, FaRobot, FaTrash } from "react-icons/fa";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";
import StatusBadge from "../Shared/StatusBadge";
import {
  AIWarning,
  ListBlock,
  ProviderBadge,
  ScoreBlock,
} from "../AI/AIResultBlocks";
import { APPLICATION_STATUSES } from "../../constants/jobOptions";
import { USER_ROLES } from "../../constants/userRoles";
import { formatDate } from "../../utils/formatters";

const MyApplications = () => {
  const { user, setUser } = useContext(Context);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === USER_ROLES.EMPLOYER) {
        const { data } = await api.get("/application/employer/getall");
        setApplications(data.applications || []);
      } else if (user?.role === USER_ROLES.JOB_SEEKER) {
        const { data } = await api.get("/application/jobseeker/dashboard");
        setApplications(data.applications || []);
        setStats(
          data.stats || {
            totalApplications: 0,
            pending: 0,
            shortlisted: 0,
            rejected: 0,
          }
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to load applications."));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role) {
      fetchApplications();
    }
  }, [fetchApplications, user?.role]);

  const handleResumeFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF resume.");
      event.target.value = "";
      setResumeFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume file size must be 5MB or less.");
      event.target.value = "";
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
  };

  const uploadProfileResume = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      toast.error("Please select a PDF resume.");
      return;
    }

    setResumeUploading(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const { data } = await api.put("/user/resume", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(data.message);
      setUser((current) => ({ ...current, resume: data.resume }));
      setResumeFile(null);
      setResumeAnalysis(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to upload resume."));
    } finally {
      setResumeUploading(false);
    }
  };

  const analyzeProfileResume = async () => {
    setResumeAnalyzing(true);
    try {
      const { data } = await api.post("/ai/resume-analysis");
      setResumeAnalysis(data);
      if (data.warning) toast(data.warning);
      else toast.success("Resume analysis generated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to analyze resume."));
    } finally {
      setResumeAnalyzing(false);
    }
  };

  const deleteApplication = async (id) => {
    try {
      const { data } = await api.delete(`/application/delete/${id}`);
      toast.success(data.message);
      fetchApplications();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to delete application."));
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/application/employer/status/${id}`, {
        status,
      });
      toast.success(data.message);
      setApplications((current) =>
        current.map((application) =>
          application._id === id ? { ...application, status } : application
        )
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update application status."));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading applications..." />;
  }

  if (user?.role === USER_ROLES.JOB_SEEKER) {
    return (
      <main className="page-wrap">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">Job Seeker Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Track every submitted application and keep your PDF resume ready.
          </p>
        </div>

        <section className="card-surface mb-8 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Profile Resume</h2>
              <p className="mt-1 text-sm text-slate-500">
                PDF only, up to 5MB. Applications can reuse this resume.
              </p>
              {user?.resume?.url && (
                <a
                  href={user.resume.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900"
                >
                  <FaFilePdf />
                  View Current Resume
                </a>
              )}
            </div>
            <form
              onSubmit={uploadProfileResume}
              className="flex w-full flex-col gap-3 lg:max-w-md"
            >
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleResumeFileChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={resumeUploading}
                >
                  {resumeUploading ? "Uploading..." : "Upload Resume"}
                </button>
                <button
                  type="button"
                  onClick={analyzeProfileResume}
                  className="secondary-btn"
                  disabled={!user?.resume?.url || resumeAnalyzing}
                >
                  <FaRobot />
                  {resumeAnalyzing ? "Analyzing..." : "Analyze Resume"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {resumeAnalysis && (
          <ResumeAnalysisPanel result={resumeAnalysis} />
        )}

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Applications" value={stats.totalApplications} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard label="Shortlisted" value={stats.shortlisted} />
          <StatCard label="Rejected" value={stats.rejected} />
        </div>

        <ApplicationStatusChart stats={stats} />

        {applications.length === 0 ? (
          <div className="card-surface p-8 text-center text-slate-600">
            No applications submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <JobSeekerCard
                key={application._id}
                application={application}
                deleteApplication={deleteApplication}
              />
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Applications</h1>
        <p className="mt-2 text-slate-600">
          Review candidates, open resumes, and update application status.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="card-surface p-8 text-center text-slate-600">
          No applications found.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <EmployerCard
              key={application._id}
              application={application}
              updateApplicationStatus={updateApplicationStatus}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default MyApplications;

const StatCard = ({ label, value }) => (
  <div className="card-surface p-6">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
  </div>
);

const statusChartColors = ["#f59e0b", "#059669", "#dc2626"];

const ApplicationStatusChart = ({ stats }) => {
  const data = [
    { status: "Pending", count: stats.pending },
    { status: "Shortlisted", count: stats.shortlisted },
    { status: "Rejected", count: stats.rejected },
  ];

  if (!stats.totalApplications) return null;

  return (
    <section className="card-surface mb-8 p-6">
      <h2 className="text-lg font-bold text-slate-950">Application Status Mix</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="status"
                innerRadius={52}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={statusChartColors[index % statusChartColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid content-center gap-3">
          {data.map((item, index) => (
            <div
              key={item.status}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      statusChartColors[index % statusChartColors.length],
                  }}
                />
                <span className="font-semibold text-slate-700">{item.status}</span>
              </div>
              <span className="text-lg font-bold text-slate-950">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ResumeAnalysisPanel = ({ result }) => {
  const analysis = result.analysis;

  return (
    <section className="card-surface mb-8 p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">AI Resume Analysis</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {analysis.summary}
          </p>
        </div>
        <ProviderBadge provider={result.provider} />
      </div>
      <AIWarning warning={result.warning} />
      <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          <ScoreBlock label="Resume Score" value={analysis.score} />
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Level
            </p>
            <p className="mt-2 text-lg font-bold text-slate-950">
              {analysis.level}
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ListBlock title="Detected Skills" items={analysis.detectedSkills} />
          <ListBlock title="Strengths" items={analysis.strengths} />
          <ListBlock title="Issues" items={analysis.issues} />
          <ListBlock title="Improvements" items={analysis.improvements} />
          <ListBlock title="Keyword Suggestions" items={analysis.keywordSuggestions} />
          <ListBlock title="Next Steps" items={analysis.nextSteps} />
        </div>
      </div>
    </section>
  );
};

const JobSeekerCard = ({ application, deleteApplication }) => {
  const job = application.jobID;
  const employer = application.employerID?.user;

  return (
    <article className="card-surface p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-slate-950">
              {job?.title || "Applied Job"}
            </h2>
            <StatusBadge status={application.status} />
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-800">Company:</span>{" "}
              {employer?.name || "Employer"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Applied:</span>{" "}
              {formatDate(application.appliedAt)}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{" "}
              {application.email}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Phone:</span>{" "}
              {application.phone}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {application.coverLetter}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a
            href={application.resume?.url}
            target="_blank"
            rel="noreferrer"
            className="secondary-btn"
          >
            <FaExternalLinkAlt />
            Resume
          </a>
          <button
            type="button"
            onClick={() => deleteApplication(application._id)}
            className="danger-btn"
          >
            <FaTrash />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};

const EmployerCard = ({ application, updateApplicationStatus }) => {
  const job = application.jobID;
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const summarizeCandidate = async () => {
    setSummaryLoading(true);
    try {
      const { data } = await api.get(`/ai/application-summary/${application._id}`);
      setAiSummary(data);
      if (data.warning) toast(data.warning);
      else toast.success("Candidate summary generated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to summarize candidate."));
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <article className="card-surface p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-slate-950">
              {application.name}
            </h2>
            <StatusBadge status={application.status} />
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-800">Applied For:</span>{" "}
              {job?.title || "Posted Job"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Applied:</span>{" "}
              {formatDate(application.appliedAt)}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Email:</span>{" "}
              {application.email}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Phone:</span>{" "}
              {application.phone}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-slate-800">Address:</span>{" "}
              {application.address}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {application.coverLetter}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:min-w-[220px]">
          <a
            href={application.resume?.url}
            target="_blank"
            rel="noreferrer"
            className="secondary-btn"
          >
            <FaExternalLinkAlt />
            Resume
          </a>
          <button
            type="button"
            onClick={summarizeCandidate}
            className="secondary-btn"
            disabled={summaryLoading}
          >
            <FaRobot />
            {summaryLoading ? "Summarizing..." : "AI Summary"}
          </button>
          <label>
            <span className="field-label">Status</span>
            <select
              value={application.status || "Pending"}
              onChange={(e) =>
                updateApplicationStatus(application._id, e.target.value)
              }
              className="field mt-2"
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {aiSummary && (
        <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/40 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Candidate AI Summary
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {aiSummary.summary.summary}
              </p>
            </div>
            <ProviderBadge provider={aiSummary.provider} />
          </div>
          <AIWarning warning={aiSummary.warning} />
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr_1fr]">
            <ScoreBlock label="Fit Score" value={aiSummary.summary.fitScore} />
            <ListBlock title="Strengths" items={aiSummary.summary.strengths} />
            <ListBlock title="Concerns" items={aiSummary.summary.concerns} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ListBlock
              title="Resume Highlights"
              items={aiSummary.summary.resumeHighlights}
            />
            <ListBlock
              title="Interview Focus"
              items={aiSummary.summary.interviewFocus}
            />
            <div className="rounded-lg bg-white p-4">
              <h4 className="text-sm font-bold text-slate-950">Recommendation</h4>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {aiSummary.summary.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
