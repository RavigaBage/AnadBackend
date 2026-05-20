import request from "supertest";
import express from "express";
import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { apiLimiter } from "../middleware/ratelimiter.js";


const createTestApp = () => {
  const app = express();


  app.use("/api", apiLimiter);

  app.get("/api/test", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Request successful",
    });
  });

  return app;
};

describe("API Rate Limiter", () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  test("should allow requests under the rate limit", async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get("/api/test");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

test("should block requests after exceeding rate limit", async () => {
  const agent = request.agent(app);

  for (let i = 0; i < 100; i++) {
    await agent.get("/api/test");
  }

  const blockedResponse = await agent.get("/api/test");

  expect(blockedResponse.status).toBe(429);
});

  test("should return rate limit headers", async () => {
    const response = await request(app).get("/api/test");

    expect(response.headers["ratelimit-limit"]).toBeDefined();
    expect(response.headers["ratelimit-remaining"]).toBeDefined();
  });
});