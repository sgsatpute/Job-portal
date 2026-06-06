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
