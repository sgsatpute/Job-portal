# JobPortal - MERN Stack Job Portal Application

Developer: Saurav Satpute

JobPortal is a full-stack job portal built with MongoDB, Express.js, React.js, and Node.js. It supports separate job seeker and employer workflows, job posting, real-time job filtering, PDF resume uploads, application management, and status tracking dashboards.

## Features

- User authentication for Job Seekers and Employers using JWT cookies.
- Protected frontend routes for authenticated workflows.
- Job posting and job management for employers.
- Job browsing with real-time frontend search by title or keyword.
- Filters for job type, location, and salary range.
- PDF resume upload for job seekers, stored on Cloudinary.
- Job applications with cover letter, contact details, and resume link.
- Employer application review with resume link access.
- Application status updates: Pending, Shortlisted, and Rejected.
- Job seeker dashboard with total applications, status counts, company name, application date, and current status.
- Employer dashboard with total jobs posted, total applications received, and application count per job.
- Modern React UI styled with Tailwind CSS.
- Responsive navbar with JobPortal branding.
- Professional homepage hero section.
- Loading spinners for API calls.
- Toast notifications for success and error messages using react-hot-toast.
- Input validation on forms.
- Centralized backend error handling.
- 404 page for unknown routes.

## Tech Stack

- Frontend: React.js, Vite, React Router, Tailwind CSS, Axios, react-hot-toast, React Icons
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt
- File Uploads: express-fileupload, Cloudinary
- Database: MongoDB Atlas or local MongoDB

## Setup Instructions

### Prerequisites

- Node.js
- npm
- MongoDB connection string
- Cloudinary account

### Backend Setup

1. Open the backend folder:

   ```sh
   cd backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create `backend/config/config.env` or `backend/.env` with:

   ```env
   PORT=4000
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   CLOUDINARY_CLOUD_NAME=
   FRONTEND_URL=http://localhost:5173
   DB_URL=
   JWT_SECRET_KEY=
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   NODE_ENV=development
   ```

   Use `backend/.env.example` as the template. Real `.env` files are ignored by Git and should never be committed.

4. Start the backend:

   ```sh
   npm run dev
   ```

### Frontend Setup

1. Open the frontend folder:

   ```sh
   cd frontend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create `frontend/.env` if you need a custom API URL:

   ```env
   VITE_API_URL=http://localhost:4000/api/v1
   ```

   Use `frontend/.env.example` as the template.

4. Start the frontend:

   ```sh
   npm run dev
   ```

5. Open the app at:

   ```txt
   http://localhost:5173
   ```

## Screenshots

Screenshots can be added here:

- Homepage
- Job search and filters
- Job seeker dashboard
- Employer dashboard
- Application status management

## Production Notes

- Rotate any exposed MongoDB, Cloudinary, and JWT secrets before deploying.
- Set `NODE_ENV=production` on the backend.
- Set `FRONTEND_URL` to the deployed frontend URL. Multiple origins can be comma-separated.
- For cross-domain deployments using cookies, set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`.
- Use the `/api/v1/health` endpoint for backend health checks.
- Keep MongoDB Atlas network access, database users, and Cloudinary upload permissions locked down.

## Deployment

### Backend on Render

The repository includes `render.yaml` for a Render web service.

1. Create a new Render Blueprint or Web Service from this repository.
2. Use `backend` as the root directory if creating the service manually.
3. Set these backend environment variables in Render:

   ```env
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-domain.vercel.app
   DB_URL=your-rotated-mongodb-atlas-url
   JWT_SECRET_KEY=your-new-long-random-secret
   JWT_EXPIRE=7d
   COOKIE_EXPIRE=7
   COOKIE_SAME_SITE=none
   COOKIE_SECURE=true
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ADZUNA_APP_ID=optional-adzuna-app-id
   ADZUNA_APP_KEY=optional-adzuna-app-key
   ADZUNA_COUNTRY=in
   ```

4. Build command: `npm install`
5. Start command: `npm start`
6. Health check path: `/api/v1/health`

### Frontend on Vercel

The frontend includes `frontend/vercel.json` for Vite SPA routing.

1. Import the repository into Vercel.
2. Set the Vercel project root directory to `frontend`.
3. Set this frontend environment variable:

   ```env
   VITE_API_URL=https://your-render-backend-url.onrender.com/api/v1
   ```

4. Build command: `npm run build`
5. Output directory: `dist`

### External Jobs API

External jobs are optional and currently use Adzuna through the backend proxy route:

```txt
GET /api/v1/external-jobs/search
```

Get Adzuna credentials from the Adzuna developer portal, then set `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `ADZUNA_COUNTRY` on the backend. External jobs are labeled separately in the UI and send users to the source site to apply.
