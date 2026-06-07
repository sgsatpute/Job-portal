import { useContext, useState } from "react";
import { FaMagic } from "react-icons/fa";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import { AIWarning, ListBlock, ProviderBadge } from "../AI/AIResultBlocks";

const categories = [
  "Graphics & Design",
  "Mobile App Development",
  "Frontend Web Development",
  "Business Development Executive",
  "Account & Finance",
  "Artificial Intelligence",
  "Video Animation",
  "MEAN Stack Development",
  "MERN Stack Development",
  "Data Entry Operator",
];

const initialForm = {
  title: "",
  description: "",
  category: "",
  jobType: "",
  country: "",
  city: "",
  location: "",
  salaryFrom: "",
  salaryTo: "",
  fixedSalary: "",
  salaryType: "",
  skills: "",
};

const TITLE_MAX_LENGTH = 30;
const DESCRIPTION_MAX_LENGTH = 500;

const PostJob = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const { user } = useContext(Context);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    const required = [
      "title",
      "description",
      "category",
      "jobType",
      "country",
      "city",
      "location",
      "salaryType",
    ];

    if (required.some((field) => !form[field])) {
      toast.error("Please fill all required job details.");
      return false;
    }
    if (form.title.trim().length < 3) {
      toast.error("Job title must contain at least 3 characters.");
      return false;
    }
    if (form.title.trim().length > TITLE_MAX_LENGTH) {
      toast.error(`Job title cannot exceed ${TITLE_MAX_LENGTH} characters.`);
      return false;
    }
    if (form.description.trim().length < 30) {
      toast.error("Job description must contain at least 30 characters.");
      return false;
    }
    if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
      toast.error(
        `Job description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`
      );
      return false;
    }
    if (form.location.trim().length < 20) {
      toast.error("Location must contain at least 20 characters.");
      return false;
    }
    if (form.salaryType === "Fixed Salary" && Number(form.fixedSalary) < 1000) {
      toast.error("Please enter a valid fixed salary.");
      return false;
    }
    if (form.salaryType === "Ranged Salary") {
      if (Number(form.salaryFrom) < 1000 || Number(form.salaryTo) < 1000) {
        toast.error("Please enter a valid salary range.");
        return false;
      }
      if (Number(form.salaryFrom) > Number(form.salaryTo)) {
        toast.error("Salary From cannot be greater than Salary To.");
        return false;
      }
    }
    return true;
  };

  const handleJobPost = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      jobType: form.jobType,
      country: form.country,
      city: form.city,
      location: form.location,
      ...(form.salaryType === "Fixed Salary"
        ? { fixedSalary: form.fixedSalary }
        : { salaryFrom: form.salaryFrom, salaryTo: form.salaryTo }),
    };

    setLoading(true);
    try {
      const { data } = await api.post("/job/post", payload);
      toast.success(data.message);
      setForm(initialForm);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to post job."));
    } finally {
      setLoading(false);
    }
  };

  const generateJobDescription = async () => {
    if (form.title.trim().length < 3) {
      toast.error("Enter a job title before using AI.");
      return;
    }

    setAiLoading(true);
    try {
      const salary =
        form.salaryType === "Fixed Salary"
          ? form.fixedSalary
          : [form.salaryFrom, form.salaryTo].filter(Boolean).join(" - ");
      const { data } = await api.post("/ai/job-description", {
        title: form.title,
        category: form.category,
        jobType: form.jobType,
        country: form.country,
        city: form.city,
        location: form.location,
        skills: form.skills,
        salary,
      });
      setAiDraft(data);
      updateField("description", data.draft.description);
      if (data.warning) toast(data.warning);
      else toast.success("Job description generated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to generate job description."));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Post a New Job</h1>
        <p className="mt-2 text-slate-600">
          Posting as {user?.name || "Employer"}.
        </p>
      </div>

      <form onSubmit={handleJobPost} className="card-surface space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">Job Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="field mt-2"
              placeholder="Frontend Developer"
              maxLength={TITLE_MAX_LENGTH}
            />
          </label>

          <label>
            <span className="field-label">Category</span>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="field mt-2"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Job Type</span>
            <select
              value={form.jobType}
              onChange={(e) => updateField("jobType", e.target.value)}
              className="field mt-2"
            >
              <option value="">Select Job Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
            </select>
          </label>

          <label>
            <span className="field-label">Country</span>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="field mt-2"
              placeholder="India"
            />
          </label>

          <label>
            <span className="field-label">City</span>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="field mt-2"
              placeholder="Pune"
            />
          </label>

          <label>
            <span className="field-label">Salary Type</span>
            <select
              value={form.salaryType}
              onChange={(e) => updateField("salaryType", e.target.value)}
              className="field mt-2"
            >
              <option value="">Select Salary Type</option>
              <option value="Fixed Salary">Fixed Salary</option>
              <option value="Ranged Salary">Ranged Salary</option>
            </select>
          </label>
        </div>

        {form.salaryType === "Fixed Salary" && (
          <label className="block">
            <span className="field-label">Fixed Salary</span>
            <input
              type="number"
              value={form.fixedSalary}
              onChange={(e) => updateField("fixedSalary", e.target.value)}
              className="field mt-2"
              placeholder="50000"
            />
          </label>
        )}

        {form.salaryType === "Ranged Salary" && (
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="field-label">Salary From</span>
              <input
                type="number"
                value={form.salaryFrom}
                onChange={(e) => updateField("salaryFrom", e.target.value)}
                className="field mt-2"
                placeholder="30000"
              />
            </label>
            <label>
              <span className="field-label">Salary To</span>
              <input
                type="number"
                value={form.salaryTo}
                onChange={(e) => updateField("salaryTo", e.target.value)}
                className="field mt-2"
                placeholder="70000"
              />
            </label>
          </div>
        )}

        <label className="block">
          <span className="field-label">Full Location</span>
          <input
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="field mt-2"
            placeholder="Office address or remote policy details"
          />
        </label>

        <label className="block">
          <span className="field-label">Key Skills</span>
          <textarea
            rows="3"
            value={form.skills}
            onChange={(e) => updateField("skills", e.target.value)}
            className="field mt-2"
            placeholder="React, Node.js, MongoDB, Express"
            maxLength={500}
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between gap-3">
            <span className="field-label">Job Description</span>
            <button
              type="button"
              onClick={generateJobDescription}
              className="secondary-btn px-3 py-2"
              disabled={aiLoading}
            >
              <FaMagic />
              {aiLoading ? "Generating..." : "Generate"}
            </button>
          </span>
          <textarea
            rows="8"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="field mt-2"
            placeholder="Responsibilities, requirements, and selection process"
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
        </label>

        {aiDraft && (
          <section className="rounded-lg border border-brand-100 bg-brand-50/40 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-lg font-bold text-slate-950">
                AI Job Draft
              </h2>
              <ProviderBadge provider={aiDraft.provider} />
            </div>
            <AIWarning warning={aiDraft.warning} />
            <div className="grid gap-4 md:grid-cols-2">
              <ListBlock
                title="Responsibilities"
                items={aiDraft.draft.responsibilities}
              />
              <ListBlock title="Requirements" items={aiDraft.draft.requirements} />
              <ListBlock title="Skills" items={aiDraft.draft.skills} />
              <ListBlock
                title="Screening Questions"
                items={aiDraft.draft.screeningQuestions}
              />
            </div>
            <p className="mt-4 rounded-lg bg-white p-4 text-sm font-semibold text-slate-700">
              Salary: {aiDraft.draft.salarySuggestion}
            </p>
          </section>
        )}

        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? "Creating Job..." : "Create Job"}
        </button>
      </form>
    </main>
  );
};

export default PostJob;
