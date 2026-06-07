import { useContext, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaBriefcase, FaPencilAlt, FaRegUser } from "react-icons/fa";
import { FaPhoneFlip } from "react-icons/fa6";
import { MdOutlineMailOutline } from "react-icons/md";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";
import { ROLE_OPTIONS } from "../../constants/userRoles";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { authLoading, isAuthorized, setIsAuthorized, setUser } =
    useContext(Context);

  const validateForm = () => {
    if (!role || !name || !email || !phone || !password) {
      toast.error("Please fill the complete registration form.");
      return false;
    }
    if (name.trim().length < 3) {
      toast.error("Name must contain at least 3 characters.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!/^[0-9]{10,15}$/.test(phone)) {
      toast.error("Phone number must contain 10 to 15 digits.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await api.post("/user/register", {
        name,
        phone,
        email,
        role,
        password,
      });
      toast.success(data.message);
      setUser(data.user);
      setIsAuthorized(true);
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
            <h1 className="text-3xl font-bold text-slate-950">JobPortal</h1>
            <p className="mt-2 text-slate-600">Create your account to get started.</p>
          </div>

          <form onSubmit={handleRegister} className="card-surface space-y-5 p-6">
            <div>
              <label className="field-label" htmlFor="role">
                Register As
              </label>
              <div className="relative mt-2">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="field pr-10"
                >
                  <option value="">Select Role</option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FaRegUser className="pointer-events-none absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="name">
                Name
              </label>
              <div className="relative mt-2">
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field pr-10"
                />
                <FaPencilAlt className="pointer-events-none absolute right-3 top-3 text-slate-400" />
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
              <label className="field-label" htmlFor="phone">
                Phone Number
              </label>
              <div className="relative mt-2">
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field pr-10"
                />
                <FaPhoneFlip className="pointer-events-none absolute right-3 top-3 text-slate-400" />
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
                  placeholder="At least 8 characters"
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
              {loading ? "Registering..." : "Register"}
            </button>
            <Link to="/login" className="secondary-btn w-full">
              Login Instead
            </Link>
          </form>
        </div>
      </section>
      <section className="hidden bg-slate-100 lg:block">
        <img
          src="/register.png"
          alt="Registration illustration"
          className="h-full w-full object-contain p-12"
        />
      </section>
    </main>
  );
};

export default Register;
