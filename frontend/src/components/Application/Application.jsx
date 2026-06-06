import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";

const Application = () => {
  const { user } = useContext(Context);
  const [form, setForm] = useState({
    name: "",
    email: "",
    coverLetter: "",
    phone: "",
    address: "",
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const navigateTo = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }));
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");

    if (!file) {
      setResume(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setFileError("Please select a PDF resume.");
      setResume(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("Resume file size must be 5MB or less.");
      setResume(null);
      return;
    }

    setResume(file);
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.coverLetter) {
      toast.error("Please fill all application fields.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!/^[0-9]{10,15}$/.test(String(form.phone))) {
      toast.error("Phone number must contain 10 to 15 digits.");
      return false;
    }
    if (form.coverLetter.trim().length < 20) {
      toast.error("Cover letter must contain at least 20 characters.");
      return false;
    }
    if (!resume && !user?.resume?.url) {
      setFileError("Upload a PDF resume here or from your dashboard first.");
      return false;
    }
    return true;
  };

  const handleApplication = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    formData.append("coverLetter", form.coverLetter);
    formData.append("jobId", id);
    if (resume) {
      formData.append("resume", resume);
    }

    try {
      const { data } = await api.post("/application/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(data.message);
      navigateTo("/applications/me");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to submit application."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Apply for Job</h1>
        <p className="mt-2 text-slate-600">
          Submit your profile details, cover letter, and PDF resume.
        </p>
      </div>

      <form onSubmit={handleApplication} className="card-surface space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="field mt-2"
            />
          </label>

          <label>
            <span className="field-label">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="field mt-2"
            />
          </label>

          <label>
            <span className="field-label">Phone Number</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="field mt-2"
            />
          </label>

          <label>
            <span className="field-label">Address</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="field mt-2"
            />
          </label>
        </div>

        <label className="block">
          <span className="field-label">Cover Letter</span>
          <textarea
            rows="7"
            value={form.coverLetter}
            onChange={(e) => updateField("coverLetter", e.target.value)}
            className="field mt-2"
            placeholder="Share why you are a strong fit for this role."
          />
        </label>

        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-800">Resume PDF</p>
              <p className="mt-1 text-sm text-slate-500">
                Upload a PDF now or use your dashboard resume.
              </p>
            </div>
            {user?.resume?.url && (
              <a
                href={user.resume.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-brand-700 hover:text-brand-900"
              >
                View Profile Resume
              </a>
            )}
          </div>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-brand-700"
          />
          {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
          {resume && (
            <p className="mt-2 text-sm font-medium text-slate-600">
              Selected: {resume.name}
            </p>
          )}
        </div>

        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </main>
  );
};

export default Application;
