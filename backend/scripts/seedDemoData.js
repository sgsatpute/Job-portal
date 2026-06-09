import mongoose from "mongoose";
import { USER_ROLES } from "../constants/applicationConstants.js";
import dbConnection from "../database/dbConnection.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { Notification } from "../models/notificationSchema.js";
import { RecommendationScore } from "../models/recommendationScoreSchema.js";
import { RefreshToken } from "../models/refreshTokenSchema.js";
import { SavedJob } from "../models/savedJobSchema.js";
import { User } from "../models/userSchema.js";
import { env } from "../config/env.js";

const demoPassword = "Password123";
const employerEmail = "demo.employer@sauravjobportal.com";
const candidateEmail = "demo.candidate@sauravjobportal.com";
const demoEmails = [employerEmail, candidateEmail];
const demoJobTitles = [
  "Demo Full Stack Developer",
  "Demo Frontend Intern",
  "Demo Backend Developer",
];

const refuseUnsafeProductionSeed = () => {
  if (env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Refusing to seed production without ALLOW_DEMO_SEED=true. This script only resets demo records, but production seeding should still be explicit."
    );
  }
};

const removeExistingDemoData = async () => {
  const demoUsers = await User.find({ email: { $in: demoEmails } }).select("_id");
  const demoUserIds = demoUsers.map((user) => user._id);

  const demoJobs = await Job.find({
    $or: [
      { title: { $in: demoJobTitles } },
      { postedBy: { $in: demoUserIds } },
    ],
  }).select("_id");
  const demoJobIds = demoJobs.map((job) => job._id);

  const demoApplications = await Application.find({
    $or: [
      { "applicantID.user": { $in: demoUserIds } },
      { "employerID.user": { $in: demoUserIds } },
      { jobID: { $in: demoJobIds } },
    ],
  }).select("_id");
  const demoApplicationIds = demoApplications.map((application) => application._id);

  await Promise.all([
    RefreshToken.deleteMany({ user: { $in: demoUserIds } }),
    RecommendationScore.deleteMany({
      $or: [
        { user: { $in: demoUserIds } },
        { job: { $in: demoJobIds } },
        { application: { $in: demoApplicationIds } },
      ],
    }),
    Notification.deleteMany({
      $or: [
        { recipient: { $in: demoUserIds } },
        { "data.jobId": { $in: demoJobIds } },
        { "data.applicationId": { $in: demoApplicationIds } },
      ],
    }),
    SavedJob.deleteMany({
      $or: [
        { user: { $in: demoUserIds } },
        { job: { $in: demoJobIds } },
      ],
    }),
    Application.deleteMany({ _id: { $in: demoApplicationIds } }),
    Job.deleteMany({
      $or: [
        { _id: { $in: demoJobIds } },
        { postedBy: { $in: demoUserIds } },
      ],
    }),
    User.deleteMany({ email: { $in: demoEmails } }),
  ]);
};

const createDemoUsers = async () => {
  const employer = await User.create({
    name: "Demo Employer",
    email: employerEmail,
    phone: 9876543210,
    password: demoPassword,
    role: USER_ROLES.EMPLOYER,
    profile: {
      companyName: "Saurav Demo Hiring",
      companyWebsite: "https://job-portal-blue-six.vercel.app",
      companyDescription:
        "Demo employer account for showcasing job posting, application review, analytics, interviews, and private recruiter notes.",
      location: "Pune, Maharashtra",
    },
  });

  const candidate = await User.create({
    name: "Demo Candidate",
    email: candidateEmail,
    phone: 9876501234,
    password: demoPassword,
    role: USER_ROLES.JOB_SEEKER,
    resume: {
      public_id: "demo-resume",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    },
    resumeText:
      "React JavaScript Node.js Express MongoDB REST API Tailwind CSS JWT authentication testing deployment Docker GitHub Actions job portal project",
    profile: {
      headline: "Full Stack MERN Developer",
      location: "Pune, Maharashtra",
      skills:
        "React, JavaScript, Node.js, Express.js, MongoDB, REST APIs, Tailwind CSS, JWT, Docker, GitHub Actions",
      experience:
        "Built MERN applications with role-based access, dashboards, file uploads, and deployment workflows.",
      education: "BTech Computer Engineering",
    },
  });

  return { employer, candidate };
};

const createDemoJobs = async (employerId) =>
  Job.insertMany([
    {
      title: "Demo Full Stack Developer",
      description:
        "Build MERN features, reusable React components, secure Express APIs, and production dashboards for a placement-ready hiring platform.",
      category: "Software Development",
      jobType: "Full-time",
      country: "India",
      city: "Pune",
      location: "Pune, Maharashtra, India - Hybrid office role",
      fixedSalary: 85000,
      postedBy: employerId,
    },
    {
      title: "Demo Frontend Intern",
      description:
        "Work on React pages, Tailwind components, responsive layouts, API integration, and user-friendly job seeker workflows.",
      category: "Frontend Development",
      jobType: "Internship",
      country: "India",
      city: "Mumbai",
      location: "Mumbai, Maharashtra, India - Remote friendly",
      salaryFrom: 15000,
      salaryTo: 25000,
      postedBy: employerId,
    },
    {
      title: "Demo Backend Developer",
      description:
        "Create Express APIs, MongoDB models, authentication flows, background jobs, notifications, and analytics endpoints.",
      category: "Backend Development",
      jobType: "Full-time",
      country: "India",
      city: "Bengaluru",
      location: "Bengaluru, Karnataka, India - Office based",
      salaryFrom: 70000,
      salaryTo: 110000,
      postedBy: employerId,
    },
  ]);

const createDemoApplication = async ({ candidate, employer, job }) => {
  const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return Application.create({
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    address: "Pune, Maharashtra, India",
    coverLetter:
      "I am interested in this MERN developer role because it matches my React, Node.js, MongoDB, Tailwind CSS, and API integration experience.",
    resume: candidate.resume,
    resumeText: candidate.resumeText,
    status: "Shortlisted",
    interview: {
      scheduledAt,
      mode: "Video Call",
      location: "https://meet.example.com/demo-jobportal-interview",
      notes: "Prepare to discuss MERN architecture, authentication, and dashboard design.",
      status: "Scheduled",
      scheduledBy: employer._id,
      scheduledOn: new Date(),
    },
    employerNotes: [
      {
        note: "Strong MERN keywords and relevant project experience. Ask about refresh-token rotation and resume parsing.",
        createdBy: employer._id,
      },
      {
        note: "Good fit for frontend plus backend internship conversion discussion.",
        createdBy: employer._id,
      },
    ],
    jobID: job._id,
    applicantID: {
      user: candidate._id,
      role: USER_ROLES.JOB_SEEKER,
    },
    employerID: {
      user: employer._id,
      role: USER_ROLES.EMPLOYER,
    },
  });
};

const createDemoRelatedData = async ({ candidate, employer, jobs, application }) => {
  await Promise.all([
    SavedJob.create({
      user: candidate._id,
      job: jobs[1]._id,
    }),
    Notification.insertMany([
      {
        recipient: employer._id,
        type: "APPLICATION_SUBMITTED",
        title: "Demo application received",
        message: `${candidate.name} applied for ${jobs[0].title}.`,
        data: {
          applicationId: application._id,
          jobId: jobs[0]._id,
        },
      },
      {
        recipient: candidate._id,
        type: "INTERVIEW_SCHEDULED",
        title: "Demo interview scheduled",
        message: `Your interview for ${jobs[0].title} is scheduled.`,
        data: {
          applicationId: application._id,
          jobId: jobs[0]._id,
        },
      },
    ]),
    RecommendationScore.insertMany([
      {
        type: "JOB_FOR_CANDIDATE",
        user: candidate._id,
        job: jobs[2]._id,
        score: 88,
        reasons: ["MERN stack match", "Backend API experience", "Deployment skills"],
        matchingSkills: ["Node.js", "Express.js", "MongoDB", "Docker"],
        missingSkills: ["System design at scale"],
      },
      {
        type: "CANDIDATE_FOR_JOB",
        user: candidate._id,
        job: jobs[0]._id,
        application: application._id,
        score: 91,
        reasons: ["React and Node.js skills", "Resume has matching project keywords"],
        matchingSkills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
        missingSkills: ["Advanced monitoring"],
      },
    ]),
  ]);
};

const seedDemoData = async () => {
  refuseUnsafeProductionSeed();
  await dbConnection();
  await removeExistingDemoData();

  const { employer, candidate } = await createDemoUsers();
  const jobs = await createDemoJobs(employer._id);
  const application = await createDemoApplication({
    candidate,
    employer,
    job: jobs[0],
  });
  await createDemoRelatedData({
    candidate,
    employer,
    jobs,
    application,
  });

  console.log("Demo data seeded successfully.");
  console.log(`Employer:  ${employerEmail}`);
  console.log(`Candidate: ${candidateEmail}`);
  console.log(`Password:  ${demoPassword}`);
};

seedDemoData()
  .catch((error) => {
    console.error("Demo seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
