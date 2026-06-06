import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";

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
};

const PostJob = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
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
    if (form.description.trim().length < 30) {
      toast.error("Job description must contain at least 30 characters.");
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
          <span className="field-label">Job Description</span>
          <textarea
            rows="8"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className="field mt-2"
            placeholder="Responsibilities, requirements, and selection process"
          />
        </label>

        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? "Creating Job..." : "Create Job"}
        </button>
      </form>
    </main>
  );
};

export default PostJob;
