import { useContext, useState } from "react";
import { FaBars, FaBriefcase, FaTimes } from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import api, { getErrorMessage } from "../../utils/api";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthorized, setIsAuthorized, user, setUser } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await api.get("/user/logout");
      toast.success(response.data.message);
    } catch (error) {
      toast.error(getErrorMessage(error, "Logged out."));
    } finally {
      setUser({});
      setIsAuthorized(false);
      setShow(false);
      navigateTo("/login");
    }
  };

  const navLinks = isAuthorized ? [
    { to: "/", label: "Home" },
    { to: "/job/getall", label: "Jobs" },
    { to: "/external-jobs", label: "External Jobs" },
    {
      to: "/applications/me",
      label: user?.role === "Employer" ? "Applications" : "Dashboard",
    },
    { to: "/profile", label: "Profile" },
  ] : [
    { to: "/", label: "Home" },
    { to: "/job/getall", label: "Jobs" },
  ];

  if (user?.role === "Employer") {
    navLinks.push(
      { to: "/job/post", label: "Post Job" },
      { to: "/job/me", label: "Employer Dashboard" }
    );
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-brand-700"
          onClick={() => setShow(false)}
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
            <FaBriefcase />
          </span>
          JobPortal
        </Link>

        <button
          className="inline-flex rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          onClick={() => setShow((value) => !value)}
          aria-label={show ? "Close navigation" : "Open navigation"}
          type="button"
        >
          {show ? <FaTimes /> : <FaBars />}
        </button>

        <div
          className={`absolute left-0 top-16 w-full border-b border-slate-200 bg-white px-4 py-4 shadow-soft lg:static lg:flex lg:w-auto lg:items-center lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
            show ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setShow(false)}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${
                    isActive
                      ? "text-brand-700"
                      : "text-slate-600 hover:text-brand-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthorized ? (
              <button type="button" onClick={handleLogout} className="secondary-btn">
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Link
                  to="/login"
                  onClick={() => setShow(false)}
                  className="secondary-btn"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShow(false)}
                  className="primary-btn"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
