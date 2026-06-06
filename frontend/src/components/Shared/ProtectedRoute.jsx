import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Context } from "../../main";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authLoading, isAuthorized, user } = useContext(Context);

  if (authLoading) {
    return <LoadingSpinner label="Checking session..." />;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
