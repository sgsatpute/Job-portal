import { useContext, useEffect, useState } from "react";
import { FaBriefcase, FaLightbulb, FaRobot, FaWandMagicSparkles } from "react-icons/fa6";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import { formatSalary } from "../../utils/formatters";

const initialForm = {
  targetRole: "",
  skills: "",
  experience: "",
  goal: "",
  jobTitle: "",
  jobCategory: "",
  jobType: "",
  jobDescription: "",
  jobLocation: "",
  salary: "",
};

const AdviceList = ({ title, items }) => (
  <div className="card-surface p-5">
    <h3 className="text-base font-bold text-slate-950">{title}</h3>
    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
      {(items || []).map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const providerLabels = {
  gemini: "Gemini",
  "smart-fallback": "Smart advisor",
};

const AIAdvisor = () => {
  const { state } = useLocation();
  const { user } = useContext(Context);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!state?.job) return;

    const job = state.job;
    setForm((current) => ({
      ...current,
      targetRole: job.title || current.targetRole,
      jobTitle: job.title || "",
      jobCategory: job.category || "",
      jobType: job.jobType || "",
      jobDescription: job.description || "",
      jobLocation: [job.city, job.country].filter(Boolean).join(", "),
      salary: formatSalary(job),
    }));
  }, [state]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      skills: current.skills || user?.profile?.skills || "",
      experience:
        current.experience ||
        user?.profile?.experience ||
        user?.profile?.education ||
        "",
    }));
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.targetRole.trim() && !form.jobTitle.trim()) {
      toast.error("Enter a target role or select a job.");
      return false;
    }
    if (!form.skills.trim() && !form.experience.trim()) {
      toast.error("Add your skills or experience so AI can review fit.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.post("/ai/career-advice", form);
      setResult(data);
      if (data.warning) toast(data.warning);
      else toast.success("AI advice generated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to generate AI advice."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
            <FaRobot />
            AI Career Assistant
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-950">
            Get job-fit advice before you apply.
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Compare your skills with a target role, find resume gaps, and prepare
            stronger interview answers.
          </p>
        </div>
        <div className="card-surface p-4 text-sm text-slate-600">
          Signed in as <span className="font-semibold text-slate-950">{user?.name}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="card-surface space-y-5 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="field-label">Target Role</span>
              <input
                type="text"
                value={form.targetRole}
                onChange={(e) => updateField("targetRole", e.target.value)}
                className="field mt-2"
                placeholder="MERN Stack Developer"
                maxLength={80}
              />
            </label>

            <label>
              <span className="field-label">Goal</span>
              <input
                type="text"
                value={form.goal}
                onChange={(e) => updateField("goal", e.target.value)}
                className="field mt-2"
                placeholder="Placement, internship, switch"
                maxLength={120}
              />
            </label>
          </div>

          <label className="block">
            <span className="field-label">Skills</span>
            <textarea
              rows="4"
              value={form.skills}
              onChange={(e) => updateField("skills", e.target.value)}
              className="field mt-2"
              placeholder="React, Node.js, MongoDB, Express, Tailwind..."
              maxLength={900}
            />
          </label>

          <label className="block">
            <span className="field-label">Experience / Projects</span>
            <textarea
              rows="5"
              value={form.experience}
              onChange={(e) => updateField("experience", e.target.value)}
              className="field mt-2"
              placeholder="Describe your projects, internships, certificates, or achievements."
              maxLength={1200}
            />
          </label>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-950">
              <FaBriefcase className="text-brand-600" />
              Job Context
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={form.jobTitle}
                onChange={(e) => updateField("jobTitle", e.target.value)}
                className="field"
                placeholder="Job title"
                maxLength={80}
              />
              <input
                type="text"
                value={form.jobCategory}
                onChange={(e) => updateField("jobCategory", e.target.value)}
                className="field"
                placeholder="Category"
                maxLength={80}
              />
              <input
                type="text"
                value={form.jobType}
                onChange={(e) => updateField("jobType", e.target.value)}
                className="field"
                placeholder="Job type"
                maxLength={80}
              />
              <input
                type="text"
                value={form.jobLocation}
                onChange={(e) => updateField("jobLocation", e.target.value)}
                className="field"
                placeholder="Location"
                maxLength={120}
              />
            </div>
            <textarea
              rows="4"
              value={form.jobDescription}
              onChange={(e) => updateField("jobDescription", e.target.value)}
              className="field mt-4"
              placeholder="Paste job description if you want a stronger match review."
              maxLength={1200}
            />
          </div>

          <button type="submit" className="primary-btn w-full" disabled={loading}>
            <FaWandMagicSparkles />
            {loading ? "Generating Advice..." : "Generate AI Advice"}
          </button>
        </form>

        <section className="space-y-5">
          {!result ? (
            <div className="card-surface p-8">
              <FaLightbulb className="text-3xl text-brand-600" />
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                What you will get
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  "Job-fit score",
                  "Skill strengths",
                  "Missing areas",
                  "Resume improvements",
                  "Next action plan",
                  "Interview questions",
                ].map((item) => (
                  <div key={item} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="card-surface p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Job-fit score
                    </p>
                    <p className="mt-2 text-4xl font-bold text-slate-950">
                      {result.advice.matchScore}%
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {providerLabels[result.provider] || "AI advisor"}
                  </span>
                </div>
                <p className="mt-5 leading-7 text-slate-700">
                  {result.advice.summary}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <AdviceList title="Strengths" items={result.advice.strengths} />
                <AdviceList title="Gaps To Fix" items={result.advice.gaps} />
                <AdviceList title="Next Steps" items={result.advice.nextSteps} />
                <AdviceList title="Resume Tips" items={result.advice.resumeTips} />
              </div>
              <AdviceList
                title="Interview Questions To Prepare"
                items={result.advice.interviewQuestions}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default AIAdvisor;
