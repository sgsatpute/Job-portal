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

  it("lets job seekers save and unsave jobs", async () => {
    const employer = await registerAgent(employerPayload);
    const seeker = await registerAgent(seekerPayload);

    const postResponse = await employer.agent
      .post("/api/v1/job/post")
      .send(jobPayload)
      .expect(200);

    const jobId = postResponse.body.job._id;

    await employer.agent.post(`/api/v1/saved-jobs/${jobId}`).expect(403);

    const emptyIdsResponse = await seeker.agent
      .get("/api/v1/saved-jobs/ids")
      .expect(200);
    expect(emptyIdsResponse.body.jobIds).toEqual([]);

    const saveResponse = await seeker.agent
      .post(`/api/v1/saved-jobs/${jobId}`)
      .expect(200);

    expect(saveResponse.body.savedJob.job._id).toBe(jobId);

    await seeker.agent.post(`/api/v1/saved-jobs/${jobId}`).expect(200);

    const listResponse = await seeker.agent.get("/api/v1/saved-jobs").expect(200);
    expect(listResponse.body.savedJobs).toHaveLength(1);
    expect(listResponse.body.savedJobs[0].job.title).toBe(jobPayload.title);

    const idsResponse = await seeker.agent.get("/api/v1/saved-jobs/ids").expect(200);
    expect(idsResponse.body.jobIds).toEqual([jobId]);

    await seeker.agent.delete(`/api/v1/saved-jobs/${jobId}`).expect(200);

    const finalListResponse = await seeker.agent
      .get("/api/v1/saved-jobs")
      .expect(200);
    expect(finalListResponse.body.savedJobs).toHaveLength(0);
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

    const employerNotifications = await employer.agent
      .get("/api/v1/notifications")
      .expect(200);

    expect(employerNotifications.body.unreadCount).toBeGreaterThanOrEqual(2);
    expect(
      employerNotifications.body.notifications.map(
        (notification) => notification.type
      )
    ).toEqual(
      expect.arrayContaining(["APPLICATION_SUBMITTED", "RESUME_UPLOADED"])
    );

    const candidateRecommendations = await employer.agent
      .get(`/api/v1/recommendations/candidates/${postResponse.body.job._id}`)
      .expect(200);

    expect(candidateRecommendations.body.recommendations).toHaveLength(1);
    expect(candidateRecommendations.body.recommendations[0].score).toEqual(
      expect.any(Number)
    );

    const jobRecommendations = await seeker.agent
      .get("/api/v1/recommendations/jobs")
      .expect(200);

    expect(jobRecommendations.body.recommendations.length).toBeGreaterThan(0);

    const employerDashboard = await employer.agent
      .get("/api/v1/job/employer/dashboard")
      .expect(200);

    expect(employerDashboard.body.stats).toMatchObject({
      totalJobsPosted: 1,
      totalApplicationsReceived: 1,
    });
    expect(employerDashboard.body.jobs[0].applicationCount).toBe(1);

    const noteResponse = await employer.agent
      .post(`/api/v1/application/employer/notes/${applicationResponse.body.application._id}`)
      .send({
        note: "Strong MERN background. Ask follow-up questions about JWT cookies and dashboard analytics.",
      })
      .expect(201);

    expect(noteResponse.body.application.employerNotes).toHaveLength(1);
    expect(noteResponse.body.application.employerNotes[0].note).toContain(
      "Strong MERN background"
    );

    await seeker.agent
      .post(`/api/v1/application/employer/notes/${applicationResponse.body.application._id}`)
      .send({ note: "Candidates should not be able to add employer notes." })
      .expect(403);

    const employerApplications = await employer.agent
      .get("/api/v1/application/employer/getall")
      .expect(200);

    expect(employerApplications.body.applications[0].employerNotes).toHaveLength(
      1
    );

    const seekerDashboardBeforeNoteDelete = await seeker.agent
      .get("/api/v1/application/jobseeker/dashboard")
      .expect(200);

    expect(
      seekerDashboardBeforeNoteDelete.body.applications[0].employerNotes
    ).toBeUndefined();

    const noteId = noteResponse.body.application.employerNotes[0]._id;
    const deleteNoteResponse = await employer.agent
      .delete(
        `/api/v1/application/employer/notes/${applicationResponse.body.application._id}/${noteId}`
      )
      .expect(200);

    expect(deleteNoteResponse.body.application.employerNotes).toHaveLength(0);

    const statusResponse = await employer.agent
      .put(`/api/v1/application/employer/status/${applicationResponse.body.application._id}`)
      .send({ status: "Shortlisted" })
      .expect(200);

    expect(statusResponse.body.application.status).toBe("Shortlisted");

    const seekerNotifications = await seeker.agent
      .get("/api/v1/notifications")
      .expect(200);

    expect(seekerNotifications.body.notifications[0].type).toBe(
      "APPLICATION_SHORTLISTED"
    );

    const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const interviewResponse = await employer.agent
      .put(`/api/v1/application/employer/interview/${applicationResponse.body.application._id}`)
      .send({
        scheduledAt: scheduledAt.toISOString(),
        mode: "Video Call",
        location: "https://meet.example.com/react-interview",
        notes: "Prepare to discuss React components and API integration.",
      })
      .expect(200);

    expect(interviewResponse.body.application.status).toBe("Shortlisted");
    expect(interviewResponse.body.application.interview).toMatchObject({
      mode: "Video Call",
      location: "https://meet.example.com/react-interview",
      status: "Scheduled",
    });

    const interviewNotifications = await seeker.agent
      .get("/api/v1/notifications")
      .expect(200);

    expect(interviewNotifications.body.notifications[0].type).toBe(
      "INTERVIEW_SCHEDULED"
    );

    const cancelInterviewResponse = await employer.agent
      .put(`/api/v1/application/employer/interview/${applicationResponse.body.application._id}/cancel`)
      .expect(200);

    expect(cancelInterviewResponse.body.application.interview.status).toBe(
      "Cancelled"
    );

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
    expect(seekerDashboard.body.applications[0].interview.status).toBe(
      "Cancelled"
    );
  });
});
