import { useContext, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaBriefcase, FaRegUser } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import LoadingSpinner from "../Shared/LoadingSpinner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { authLoading, isAuthorized, setIsAuthorized, setUser } =
    useContext(Context);

  const validateForm = () => {
    if (!role || !email || !password) {
      toast.error("Please enter role, email, and password.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.post("/user/login", { email, password, role });
      toast.success(data.message);
      setUser(data.user);
      setIsAuthorized(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner label="Checking session..." />;
  }

  if (isAuthorized) {
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
            <h1 className="text-3xl font-bold text-slate-950">JobPortal</h1>
            <p className="mt-2 text-slate-600">Login to continue to your workspace.</p>
          </div>

          <form onSubmit={handleLogin} className="card-surface space-y-5 p-6">
            <div>
              <label className="field-label" htmlFor="role">
                Login As
              </label>
              <div className="relative mt-2">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="field pr-10"
                >
                  <option value="">Select Role</option>
                  <option value="Job Seeker">Job Seeker</option>
                  <option value="Employer">Employer</option>
                </select>
                <FaRegUser className="pointer-events-none absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="email">
                Email Address
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field pr-10"
                />
                <MdOutlineMailOutline className="pointer-events-none absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-11"
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

            <button type="submit" className="primary-btn w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
            <Link to="/register" className="secondary-btn w-full">
              Create Account
            </Link>
          </form>
        </div>
      </section>
      <section className="hidden bg-slate-100 lg:block">
        <img
          src="/login.png"
          alt="Login illustration"
          className="h-full w-full object-contain p-12"
        />
      </section>
    </main>
  );
};

export default Login;
