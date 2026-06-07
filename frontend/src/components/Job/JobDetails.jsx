import { useContext, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaQuestionCircle,
  FaRobot,
  FaRoute,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";
import {
  AIWarning,
  ListBlock,
  ProviderBadge,
  RoadmapBlock,
  ScoreBlock,
} from "../AI/AIResultBlocks";

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
  const [aiLoading, setAiLoading] = useState("");
  const [jobMatch, setJobMatch] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [skillRoadmap, setSkillRoadmap] = useState(null);
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

  const runJobAiAction = async (action) => {
    setAiLoading(action);
    try {
      if (action === "match") {
        const { data } = await api.get(`/ai/job-match/${id}`, {
          params: { generate: true },
        });
        setJobMatch(data);
        if (data.warning) toast(data.warning);
        else toast.success("AI match generated.");
      }

      if (action === "interview") {
        const { data } = await api.get(`/ai/interview-questions/${id}`);
        setInterviewQuestions(data);
        if (data.warning) toast(data.warning);
        else toast.success("Interview questions generated.");
      }

      if (action === "roadmap") {
        const { data } = await api.get(`/ai/skill-roadmap/${id}`);
        setSkillRoadmap(data);
        if (data.warning) toast(data.warning);
        else toast.success("Skill roadmap generated.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to generate AI result."));
    } finally {
      setAiLoading("");
    }
  };

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
              {user?.role === "Job Seeker" && (
                <>
                  <button
                    type="button"
                    onClick={() => runJobAiAction("match")}
                    className="secondary-btn"
                    disabled={Boolean(aiLoading)}
                  >
                    <FaRobot />
                    {aiLoading === "match" ? "Checking..." : "Match"}
                  </button>
                  <button
                    type="button"
                    onClick={() => runJobAiAction("roadmap")}
                    className="secondary-btn"
                    disabled={Boolean(aiLoading)}
                  >
                    <FaRoute />
                    {aiLoading === "roadmap" ? "Building..." : "Roadmap"}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => runJobAiAction("interview")}
                className="secondary-btn"
                disabled={Boolean(aiLoading)}
              >
                <FaQuestionCircle />
                {aiLoading === "interview" ? "Loading..." : "Questions"}
              </button>
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

      {(jobMatch || interviewQuestions || skillRoadmap) && (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {jobMatch && (
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    AI Job Match
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {jobMatch.match.summary}
                  </p>
                </div>
                <ProviderBadge provider={jobMatch.provider} />
              </div>
              <AIWarning warning={jobMatch.warning} />
              <div className="mt-4 grid gap-4 md:grid-cols-[170px_1fr]">
                <ScoreBlock label="Match Score" value={jobMatch.match.matchScore} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ListBlock title="Matching Skills" items={jobMatch.match.matchingSkills} />
                  <ListBlock title="Missing Skills" items={jobMatch.match.missingSkills} />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ListBlock title="Strengths" items={jobMatch.match.strengths} />
                <ListBlock title="Gaps" items={jobMatch.match.gaps} />
              </div>
            </div>
          )}

          {skillRoadmap && (
            <div className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Skill Gap Roadmap
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {skillRoadmap.roadmap.summary}
                  </p>
                </div>
                <ProviderBadge provider={skillRoadmap.provider} />
              </div>
              <AIWarning warning={skillRoadmap.warning} />
              <div className="mt-4 grid gap-4 md:grid-cols-[170px_1fr]">
                <ScoreBlock
                  label="Current Match"
                  value={skillRoadmap.roadmap.matchScore}
                />
                <ListBlock
                  title="Missing Skills"
                  items={skillRoadmap.roadmap.missingSkills}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <RoadmapBlock items={skillRoadmap.roadmap.roadmap} />
                <ListBlock
                  title="Practice Tasks"
                  items={skillRoadmap.roadmap.practiceTasks}
                />
              </div>
            </div>
          )}

          {interviewQuestions && (
            <div className="card-surface p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    AI Interview Questions
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {interviewQuestions.questions.role}
                  </p>
                </div>
                <ProviderBadge provider={interviewQuestions.provider} />
              </div>
              <AIWarning warning={interviewQuestions.warning} />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ListBlock
                  title="Technical"
                  items={interviewQuestions.questions.technicalQuestions}
                />
                <ListBlock title="HR" items={interviewQuestions.questions.hrQuestions} />
                <ListBlock
                  title="Projects"
                  items={interviewQuestions.questions.projectQuestions}
                />
                <ListBlock
                  title="Preparation"
                  items={interviewQuestions.questions.preparationTips}
                />
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default JobDetails;
