process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.DB_URL =
  process.env.TEST_DB_URL || "mongodb://127.0.0.1:27017/jobportal-test";
process.env.DB_NAME = "Job_Portal_Test";
process.env.JWT_SECRET_KEY = "test-jwt-secret-key-for-jobportal";
process.env.ACCESS_TOKEN_EXPIRE = "15m";
process.env.ACCESS_TOKEN_COOKIE_EXPIRE_MINUTES = "15";
process.env.REFRESH_TOKEN_EXPIRE_DAYS = "30";
process.env.COOKIE_EXPIRE = "7";
process.env.COOKIE_SAME_SITE = "lax";
process.env.COOKIE_SECURE = "false";
process.env.ENABLE_CSRF = "false";
process.env.ADZUNA_COUNTRY = "in";
process.env.GEMINI_MODEL = "gemini-2.5-flash";
process.env.ENABLE_BACKGROUND_JOBS = "false";
