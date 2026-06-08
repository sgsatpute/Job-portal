import request from "supertest";

let app;

beforeAll(async () => {
  app = (await import("../../app.js")).default;
});

describe("Health API", () => {
  it("returns service health", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      status: "ok",
    });
    expect(response.body.uptime).toEqual(expect.any(Number));
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
