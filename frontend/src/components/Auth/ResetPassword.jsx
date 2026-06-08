import { useContext, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaBriefcase } from "react-icons/fa";
import { Link, Navigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { authLoading, isAuthorized } = useContext(Context);

  const validateForm = () => {
    if (!password || !confirmPassword) {
      toast.error("Please enter and confirm your new password.");
      return false;
    }
    if (password.length < 8 || password.length > 32) {
      toast.error("Password must contain between 8 and 32 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.put(`/user/password/reset/${token}`, {
        password,
      });
      toast.success(data.message);
      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to reset password."));
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
            <h1 className="text-3xl font-bold text-slate-950">
              Create New Password
            </h1>
            <p className="mt-2 text-slate-600">
              Choose a password between 8 and 32 characters.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-surface space-y-5 p-6">
            <div>
              <label className="field-label" htmlFor="new-password">
                New Password
              </label>
              <div className="relative mt-2">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-11"
                  disabled={loading || completed}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-slate-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative mt-2">
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="field pr-11"
                  disabled={loading || completed}
                />
              </div>
            </div>

            {completed && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Password updated successfully.
              </div>
            )}

            <button
              type="submit"
              className="primary-btn w-full"
              disabled={loading || completed}
            >
              {loading ? "Updating..." : "Update Password"}
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

export default ResetPassword;
