import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
});

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => error?.response?.data?.message || fallback;

export default api;
