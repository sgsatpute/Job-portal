import request from "supertest";
import {
  clearTestDb,
  closeTestDb,
  connectTestDb,
} from "../helpers/testDb.js";

let app;
const describeWithDb = process.env.TEST_DB_URL ? describe : describe.skip;

const employerPayload = {
  name: "Acme Recruiter",
  email: "recruiter@example.com",
  phone: "9876543210",
  password: "Password123",
  role: "Employer",
};

describeWithDb("User API", () => {
  beforeAll(async () => {
    await connectTestDb();
    app = (await import("../../app.js")).default;
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app)
      .post("/api/v1/user/register")
      .send({
        ...employerPayload,
        email: "not-an-email",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid request");
  });

  it("registers, authenticates, and returns the current user", async () => {
    const agent = request.agent(app);

    const registerResponse = await agent
      .post("/api/v1/user/register")
      .send(employerPayload)
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.user).toMatchObject({
      name: employerPayload.name,
      email: employerPayload.email,
      role: employerPayload.role,
    });
    expect(registerResponse.headers["set-cookie"].join(";")).toContain("token=");

    const userResponse = await agent.get("/api/v1/user/getuser").expect(200);

    expect(userResponse.body.user).toMatchObject({
      email: employerPayload.email,
      role: employerPayload.role,
    });
    expect(userResponse.body.user.password).toBeUndefined();
  });

  it("rejects duplicate email and wrong password login", async () => {
    await request(app)
      .post("/api/v1/user/register")
      .send(employerPayload)
      .expect(201);

    const duplicateResponse = await request(app)
      .post("/api/v1/user/register")
      .send(employerPayload)
      .expect(400);

    expect(duplicateResponse.body.message).toBe("Email already registered.");

    const loginResponse = await request(app)
      .post("/api/v1/user/login")
      .send({
        email: employerPayload.email,
        password: "WrongPass123",
        role: employerPayload.role,
      })
      .expect(400);

    expect(loginResponse.body.message).toBe("Invalid email or password.");
  });

  it("blocks protected user routes when no cookie is present", async () => {
    const response = await request(app).get("/api/v1/user/getuser").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "User Not Authorized",
    });
  });
});
