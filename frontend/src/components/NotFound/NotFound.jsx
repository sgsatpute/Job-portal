import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="page-wrap flex min-h-[70vh] flex-col items-center justify-center text-center">
      <img
        src="/notfound.png"
        alt="Page not found"
        className="mb-6 w-full max-w-md"
      />
      <h1 className="text-3xl font-bold text-slate-950">Page Not Found</h1>
      <p className="mt-3 max-w-lg text-slate-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="primary-btn mt-6">
        Return Home
      </Link>
    </main>
  );
};

export default NotFound;
