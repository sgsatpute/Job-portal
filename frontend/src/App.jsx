import { Suspense, lazy, useContext, useEffect } from "react";
import "./App.css";
import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import api from "./utils/api";
import ProtectedRoute from "./components/Shared/ProtectedRoute";
import LoadingSpinner from "./components/Shared/LoadingSpinner";
import { USER_ROLES } from "./constants/userRoles";

const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const ForgotPassword = lazy(() => import("./components/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/Auth/ResetPassword"));
const Home = lazy(() => import("./components/Home/Home"));
const Jobs = lazy(() => import("./components/Job/Jobs"));
const JobDetails = lazy(() => import("./components/Job/JobDetails"));
const Application = lazy(() => import("./components/Application/Application"));
const MyApplications = lazy(() => import("./components/Application/MyApplications"));
const PostJob = lazy(() => import("./components/Job/PostJob"));
const NotFound = lazy(() => import("./components/NotFound/NotFound"));
const MyJobs = lazy(() => import("./components/Job/MyJobs"));
const Profile = lazy(() => import("./components/Profile/Profile"));
const ExternalJobs = lazy(() => import("./components/ExternalJobs/ExternalJobs"));
const AIAdvisor = lazy(() => import("./components/AI/AIAdvisor"));

const App = () => {
  const { setAuthLoading, setIsAuthorized, setUser } = useContext(Context);
  useEffect(() => {
    const handleExpiredSession = () => {
      setUser({});
      setIsAuthorized(false);
    };

    window.addEventListener("auth:expired", handleExpiredSession);

    const fetchUser = async () => {
      try {
        const response = await api.get("/user/getuser");
        setUser(response.data.user);
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();

    return () => {
      window.removeEventListener("auth:expired", handleExpiredSession);
    };
  }, [setAuthLoading, setIsAuthorized, setUser]);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<LoadingSpinner label="Loading page..." />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/password/forgot" element={<ForgotPassword />} />
            <Route path="/password/reset/:token" element={<ResetPassword />} />
            <Route
              path="/"
              element={<Home />}
            />
            <Route
              path="/job/getall"
              element={<Jobs />}
            />
            <Route
              path="/ai-assistant"
              element={
                <ProtectedRoute>
                  <AIAdvisor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/external-jobs"
              element={
                <ProtectedRoute>
                  <ExternalJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job/:id"
              element={
                <ProtectedRoute>
                  <JobDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/application/:id"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.JOB_SEEKER]}>
                  <Application />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/me"
              element={
                <ProtectedRoute>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job/post"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYER]}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job/me"
              element={
                <ProtectedRoute allowedRoles={[USER_ROLES.EMPLOYER]}>
                  <MyJobs />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
        <Toaster position="top-right" />
      </BrowserRouter>
    </>
  );
};

export default App;
