import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import { USER_ROLES } from "../../constants/userRoles";

const emptyProfile = {
  headline: "",
  location: "",
  companyName: "",
  companyWebsite: "",
  companyDescription: "",
  skills: "",
  experience: "",
  education: "",
};

const Profile = () => {
  const { user, setUser } = useContext(Context);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    profile: emptyProfile,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      profile: {
        ...emptyProfile,
        ...(user?.profile || {}),
      },
    });
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateProfileField = (field, value) => {
    setForm((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value },
    }));
  };

  const validateForm = () => {
    if (form.name.trim().length < 3) {
      toast.error("Name must contain at least 3 characters.");
      return false;
    }
    if (!/^[0-9]{10,15}$/.test(String(form.phone))) {
      toast.error("Phone number must contain 10 to 15 digits.");
      return false;
    }
    if (
      form.profile.companyWebsite &&
      !/^https?:\/\/.+\..+/.test(form.profile.companyWebsite)
    ) {
      toast.error("Company website must include http:// or https://.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.put("/user/profile", form);
      setUser(data.user);
      toast.success(data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update profile."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-950">Profile</h1>
        <p className="mt-2 text-slate-600">
          Keep your account details ready for applications and hiring workflows.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface space-y-5 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">Name</span>
            <input
              type="text"
              className="field mt-2"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>

          <label>
            <span className="field-label">Phone Number</span>
            <input
              type="tel"
              className="field mt-2"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label>
            <span className="field-label">Headline</span>
            <input
              type="text"
              className="field mt-2"
              value={form.profile.headline}
              onChange={(event) =>
                updateProfileField("headline", event.target.value)
              }
              placeholder={
                user?.role === USER_ROLES.EMPLOYER
                  ? "Hiring manager, recruiter, founder"
                  : "Frontend developer, fresher, analyst"
              }
            />
          </label>

          <label>
            <span className="field-label">Location</span>
            <input
              type="text"
              className="field mt-2"
              value={form.profile.location}
              onChange={(event) =>
                updateProfileField("location", event.target.value)
              }
              placeholder="City, Country"
            />
          </label>
        </div>

        {user?.role === USER_ROLES.EMPLOYER && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-950">Company Details</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="field-label">Company Name</span>
                <input
                  type="text"
                  className="field mt-2"
                  value={form.profile.companyName}
                  onChange={(event) =>
                    updateProfileField("companyName", event.target.value)
                  }
                  placeholder="Company Pvt Ltd"
                />
              </label>

              <label>
                <span className="field-label">Company Website</span>
                <input
                  type="url"
                  className="field mt-2"
                  value={form.profile.companyWebsite}
                  onChange={(event) =>
                    updateProfileField("companyWebsite", event.target.value)
                  }
                  placeholder="https://company.com"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="field-label">Company Description</span>
              <textarea
                rows="5"
                className="field mt-2"
                value={form.profile.companyDescription}
                onChange={(event) =>
                  updateProfileField("companyDescription", event.target.value)
                }
                placeholder="Short description shown in employer workflows."
              />
            </label>
          </section>
        )}

        {user?.role === USER_ROLES.JOB_SEEKER && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-950">Career Details</h2>

            <label className="mt-5 block">
              <span className="field-label">Skills</span>
              <textarea
                rows="4"
                className="field mt-2"
                value={form.profile.skills}
                onChange={(event) =>
                  updateProfileField("skills", event.target.value)
                }
                placeholder="React, Node.js, MongoDB, Express, Tailwind CSS"
                maxLength={900}
              />
            </label>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="field-label">Experience / Projects</span>
                <textarea
                  rows="5"
                  className="field mt-2"
                  value={form.profile.experience}
                  onChange={(event) =>
                    updateProfileField("experience", event.target.value)
                  }
                  placeholder="Projects, internships, responsibilities, results"
                  maxLength={1200}
                />
              </label>

              <label>
                <span className="field-label">Education</span>
                <textarea
                  rows="5"
                  className="field mt-2"
                  value={form.profile.education}
                  onChange={(event) =>
                    updateProfileField("education", event.target.value)
                  }
                  placeholder="Degree, college, CGPA, certifications"
                  maxLength={500}
                />
              </label>
            </div>
          </section>
        )}

        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
};

export default Profile;
