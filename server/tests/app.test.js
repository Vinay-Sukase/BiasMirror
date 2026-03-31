import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/User.js";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(async () => ({
      data: {
        confirmation_bias_score: 0.62,
        anchoring_bias_score: 0.48,
        negativity_bias_score: 0.58,
        confidence: 0.83,
        response_completeness: 1,
        timing_quality: 0.91,
        explanation: {
          confirmation: "Moderate reliance on belief-consistent information.",
          anchoring: "Some sensitivity to first estimates.",
          negativity: "Elevated sensitivity to downside cues."
        },
        trait_scores: {
          EXT: 0.45,
          EST: 0.7,
          AGR: 0.51,
          CSN: 0.66,
          OPN: 0.4
        },
        behavioral_features: {
          avg_response_time: 4200,
          response_variance: 1300000,
          fast_vs_slow_ratio: 1.03
        },
        model_version: "test-model",
        model_metrics: {
          r2_score: 0.84
        }
      }
    }))
  }
}));

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  const { connectToDatabase } = await import("../src/config/db.js");
  await connectToDatabase(process.env.MONGODB_URI);
  app = createApp();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

function buildAssessmentPayload() {
  const answers = {
    self_confirmation_1: 4,
    self_confirmation_2: 4,
    self_anchoring_1: 3,
    self_anchoring_2: 4,
    self_negativity_1: 4,
    self_negativity_2: 3,
    scenario_confirmation_1: 4,
    scenario_confirmation_2: 4,
    scenario_confirmation_3: 5,
    scenario_confirmation_4: 4,
    scenario_anchoring_1: 3,
    scenario_anchoring_2: 3,
    scenario_anchoring_3: 4,
    scenario_anchoring_4: 3,
    scenario_negativity_1: 4,
    scenario_negativity_2: 4,
    scenario_negativity_3: 3,
    scenario_negativity_4: 4
  };

  for (const prefix of ["EXT", "EST", "AGR", "CSN", "OPN"]) {
    for (let index = 1; index <= 10; index += 1) {
      answers[`${prefix}${index}`] = 3 + ((index + prefix.length) % 2);
    }
  }

  const responseTimes = {};
  Object.keys(answers).forEach((key, index) => {
    responseTimes[key] = 1500 + index * 25;
  });

  return { answers, responseTimes };
}

describe("BiasMirror API", () => {
  it("registers a user and completes an assessment session", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      name: "Test User",
      password: "supersecure123"
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.role).toBe("user");
    const authHeader = `Bearer ${registerRes.body.accessToken}`;

    const definitionRes = await request(app).get("/api/assessment/definition");
    expect(definitionRes.status).toBe(200);
    expect(definitionRes.body.sections).toHaveLength(3);

    const sessionRes = await request(app)
      .post("/api/assessment/sessions")
      .set("Authorization", authHeader)
      .send({});

    expect(sessionRes.status).toBe(201);

    const eventRes = await request(app)
      .post(`/api/assessment/sessions/${sessionRes.body.sessionId}/events`)
      .set("Authorization", authHeader)
      .send({
        questionId: "self_confirmation_1",
        answer: 4,
        responseTime: 1800,
        timestamp: new Date().toISOString()
      });

    expect(eventRes.status).toBe(201);

    const submitRes = await request(app)
      .post(`/api/assessment/sessions/${sessionRes.body.sessionId}/submit`)
      .set("Authorization", authHeader)
      .send(buildAssessmentPayload());

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.analytics.finalBiasScores.confirmation).toBeGreaterThan(0);
    expect(submitRes.body.resultSummary.overallTakeaway).toBeTruthy();
    expect(submitRes.body.resultSummary.biasCards).toHaveLength(3);

    const overviewRes = await request(app)
      .get("/api/dashboard/overview")
      .set("Authorization", authHeader);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.latestSnapshot).toBeTruthy();
    expect(overviewRes.body.latestSnapshot.resultSummary.strongestBias).toBeTruthy();
  });

  it("allows an admin to view oversight data and delete a session", async () => {
    const adminPassword = "AdminSecure123";
    const adminRes = await request(app).post("/api/auth/register").send({
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword
    });

    await User.findByIdAndUpdate(adminRes.body.user.id, { role: "admin" });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@example.com",
      password: adminPassword
    });

    const authHeader = `Bearer ${loginRes.body.accessToken}`;

    const sessionRes = await request(app)
      .post("/api/assessment/sessions")
      .set("Authorization", authHeader)
      .send({});

    const overviewRes = await request(app)
      .get("/api/admin/overview")
      .set("Authorization", authHeader);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.counts.admins).toBeGreaterThan(0);

    const deleteRes = await request(app)
      .delete(`/api/admin/sessions/${sessionRes.body.sessionId}`)
      .set("Authorization", authHeader);

    expect(deleteRes.status).toBe(204);
  });
});
