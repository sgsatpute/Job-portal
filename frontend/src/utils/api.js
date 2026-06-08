import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

const shouldSkipRefresh = (url = "") =>
  [
    "/user/login",
    "/user/register",
    "/user/logout",
    "/user/refresh",
    "/user/password/forgot",
    "/user/password/reset",
  ].some((path) => url.includes(path));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= refreshClient.post("/user/refresh");
      await refreshPromise;
      refreshPromise = null;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      window.dispatchEvent(new Event("auth:expired"));
      return Promise.reject({
        ...refreshError,
        response: {
          ...refreshError.response,
          data: {
            ...refreshError.response?.data,
            message: "Session expired. Please log in again.",
          },
        },
      });
    }
  }
);

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error?.response) {
    return "Cannot reach the backend API. Make sure the backend is running and open the frontend at http://localhost:5173.";
  }

  return error.response.data?.message || fallback;
};

export default api;
