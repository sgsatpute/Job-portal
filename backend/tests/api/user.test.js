import crypto from "crypto";
import request from "supertest";
import {
  clearTestDb,
  closeTestDb,
  connectTestDb,
} from "../helpers/testDb.js";

let app;
let RefreshToken;
let User;
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
    RefreshToken = (await import("../../models/refreshTokenSchema.js")).RefreshToken;
    User = (await import("../../models/userSchema.js")).User;
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
    expect(response.body.message).toContain("body.email");
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
    const cookies = registerResponse.headers["set-cookie"].join(";");
    expect(cookies).toContain("accessToken=");
    expect(cookies).toContain("token=");
    expect(cookies).toContain("refreshToken=");

    const userResponse = await agent.get("/api/v1/user/getuser").expect(200);

    expect(userResponse.body.user).toMatchObject({
      email: employerPayload.email,
      role: employerPayload.role,
    });
    expect(userResponse.body.user.password).toBeUndefined();
  });

  it("rotates refresh tokens and revokes the active session on logout", async () => {
    const agent = request.agent(app);

    await agent.post("/api/v1/user/register").send(employerPayload).expect(201);
    expect(await RefreshToken.countDocuments()).toBe(1);

    const refreshResponse = await agent.post("/api/v1/user/refresh").expect(200);
    expect(refreshResponse.body).toMatchObject({
      success: true,
      message: "Session refreshed successfully.",
    });
    expect(refreshResponse.headers["set-cookie"].join(";")).toContain(
      "refreshToken="
    );

    const sessions = await RefreshToken.find().select("+tokenHash");
    expect(sessions).toHaveLength(2);
    expect(sessions.filter((session) => session.revokedAt)).toHaveLength(1);

    await agent.get("/api/v1/user/getuser").expect(200);
    await agent.get("/api/v1/user/logout").expect(200);

    const activeSessions = await RefreshToken.countDocuments({ revokedAt: null });
    expect(activeSessions).toBe(0);

    await agent.post("/api/v1/user/refresh").expect(401);
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

  it("supports forgot password and resets login credentials", async () => {
    await request(app)
      .post("/api/v1/user/register")
      .send(employerPayload)
      .expect(201);

    const forgotResponse = await request(app)
      .post("/api/v1/user/password/forgot")
      .send({ email: employerPayload.email })
      .expect(200);

    expect(forgotResponse.body.message).toContain("password reset link");

    const userAfterForgot = await User.findOne({
      email: employerPayload.email,
    }).select("+resetPasswordToken +resetPasswordExpire");
    expect(userAfterForgot.resetPasswordToken).toBeTruthy();
    expect(userAfterForgot.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());

    await request(app)
      .put("/api/v1/user/password/reset/invalid-reset-token-value")
      .send({ password: "NewPassword123" })
      .expect(400);

    const resetToken = "test-reset-token-value-1234567890abcdef";
    userAfterForgot.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    userAfterForgot.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await userAfterForgot.save({ validateBeforeSave: false });

    const resetResponse = await request(app)
      .put(`/api/v1/user/password/reset/${resetToken}`)
      .send({ password: "NewPassword123" })
      .expect(200);

    expect(resetResponse.body.message).toBe(
      "Password reset successfully. You can now log in."
    );

    await request(app)
      .post("/api/v1/user/login")
      .send({
        email: employerPayload.email,
        password: employerPayload.password,
        role: employerPayload.role,
      })
      .expect(400);

    await request(app)
      .post("/api/v1/user/login")
      .send({
        email: employerPayload.email,
        password: "NewPassword123",
        role: employerPayload.role,
      })
      .expect(200);
  });

  it("blocks protected user routes when no cookie is present", async () => {
    const response = await request(app).get("/api/v1/user/getuser").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: "User Not Authorized",
    });
  });
});
