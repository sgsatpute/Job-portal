import request from "supertest";
import {
  clearTestDb,
  closeTestDb,
  connectTestDb,
} from "../helpers/testDb.js";

let app;
let User;
const describeWithDb = process.env.TEST_DB_URL ? describe : describe.skip;

const employerPayload = {
  name: "Hiring Manager",
  email: "hiring@example.com",
  phone: "9876543210",
  password: "Password123",
  role: "Employer",
};

const seekerPayload = {
  name: "Saurav Candidate",
  email: "candidate@example.com",
  phone: "9876501234",
  password: "Password123",
  role: "Job Seeker",
};

const jobPayload = {
  title: "React Developer",
  description:
    "Build and maintain production React applications with reusable components and clean API integration.",
  category: "Software Development",
  jobType: "Full-time",
  country: "India",
  city: "Pune",
  location: "Pune, Maharashtra, India",
  fixedSalary: 75000,
};

const registerAgent = async (payload) => {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/v1/user/register")
    .send(payload)
    .expect(201);

  return { agent, user: response.body.user };
};

describeWithDb("Job and application APIs", () => {
  beforeAll(async () => {
    await connectTestDb();
    app = (await import("../../app.js")).default;
    User = (await import("../../models/userSchema.js")).User;
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it("allows employers to post jobs and supports public filtering", async () => {
    const { agent } = await registerAgent(employerPayload);

    const postResponse = await agent
      .post("/api/v1/job/post")
      .send(jobPayload)
      .expect(200);

    expect(postResponse.body).toMatchObject({
      success: true,
      message: "Job Posted Successfully!",
    });
    expect(postResponse.body.job.title).toBe(jobPayload.title);

    const listResponse = await request(app)
      .get("/api/v1/job/getall")
      .query({ search: "react", jobType: "Full-time", salaryRange: "60000-100000" })
      .expect(200);

    expect(listResponse.body.jobs).toHaveLength(1);
    expect(listResponse.body.pagination.totalJobs).toBe(1);
    expect(listResponse.body.filters.locations).toContain("Pune, India");
  });

  it("prevents job seekers from posting jobs", async () => {
    const { agent } = await registerAgent(seekerPayload);

    const response = await agent
      .post("/api/v1/job/post")
      .send(jobPayload)
      .expect(403);

    expect(response.body.message).toBe("Job seekers are not allowed to post jobs.");
  });

  it("tracks application status through employer and job seeker dashboards", async () => {
    const employer = await registerAgent(employerPayload);
    const seeker = await registerAgent(seekerPayload);

    const postResponse = await employer.agent
      .post("/api/v1/job/post")
      .send(jobPayload)
      .expect(200);

    await User.findByIdAndUpdate(seeker.user._id, {
      resume: {
        public_id: "test-resume",
        url: "https://example.com/resume.pdf",
      },
      resumeText:
        "React JavaScript Node.js Express MongoDB Tailwind API testing deployment",
    });

    const applicationResponse = await seeker.agent
      .post("/api/v1/application/post")
      .send({
        name: seekerPayload.name,
        email: seekerPayload.email,
        phone: seekerPayload.phone,
        address: "Pune, Maharashtra",
        coverLetter:
          "I am interested in this role and have strong React and Node.js experience.",
        jobId: postResponse.body.job._id,
      })
      .expect(201);

    expect(applicationResponse.body.application.status).toBe("Pending");

    const employerDashboard = await employer.agent
      .get("/api/v1/job/employer/dashboard")
      .expect(200);

    expect(employerDashboard.body.stats).toMatchObject({
      totalJobsPosted: 1,
      totalApplicationsReceived: 1,
    });
    expect(employerDashboard.body.jobs[0].applicationCount).toBe(1);

    const statusResponse = await employer.agent
      .put(`/api/v1/application/employer/status/${applicationResponse.body.application._id}`)
      .send({ status: "Shortlisted" })
      .expect(200);

    expect(statusResponse.body.application.status).toBe("Shortlisted");

    const seekerDashboard = await seeker.agent
      .get("/api/v1/application/jobseeker/dashboard")
      .expect(200);

    expect(seekerDashboard.body.stats).toMatchObject({
      totalApplications: 1,
      pending: 0,
      shortlisted: 1,
      rejected: 0,
    });
    expect(seekerDashboard.body.applications[0].status).toBe("Shortlisted");
  });
});
