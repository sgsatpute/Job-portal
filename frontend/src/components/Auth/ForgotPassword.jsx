import { useContext, useState } from "react";
import { FaBriefcase } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { authLoading, isAuthorized } = useContext(Context);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/user/password/forgot", { email });
      toast.success(data.message);
      setSubmitted(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-brand-600 text-2xl text-white">
              <FaBriefcase />
            </div>
            <h1 className="text-3xl font-bold text-slate-950">Reset Password</h1>
            <p className="mt-2 text-slate-600">
              Enter your account email to receive a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-surface space-y-5 p-6">
            <div>
              <label className="field-label" htmlFor="reset-email">
                Email Address
              </label>
              <div className="relative mt-2">
                <input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field pr-10"
                  disabled={loading || submitted}
                />
                <MdOutlineMailOutline className="pointer-events-none absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            {submitted && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Check your inbox for the reset link.
              </div>
            )}

            <button
              type="submit"
              className="primary-btn w-full"
              disabled={loading || submitted}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <Link to="/login" className="secondary-btn w-full">
              Back To Login
            </Link>
          </form>
        </div>
      </section>
      <section className="hidden bg-slate-100 lg:block">
        <img
          src="/login.png"
          alt="Password reset illustration"
          className="h-full w-full object-contain p-12"
        />
      </section>
    </main>
  );
};

export default ForgotPassword;
