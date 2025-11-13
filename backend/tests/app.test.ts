// backend/tests/app.test.ts
import request from "supertest";
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { unlinkSync, existsSync } from "fs";

// Use a test database file (unique to app tests)
const TEST_DB_PATH = "test-app-endpoints.db";

describe("Express App Endpoints", () => {
  beforeAll(() => {
    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      try {
        unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    // Set environment variable to use test database
    process.env.DB_PATH = TEST_DB_PATH;
  });

  afterAll(async () => {
    // Close database connection
    try {
      const dbModule = await import("../src/db.js").catch(() => null);
      if (dbModule && dbModule.closeDb) {
        dbModule.closeDb();
      }
    } catch (err) {
      // Ignore errors
    }

    // Clean up test database file
    if (existsSync(TEST_DB_PATH)) {
      try {
        unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    delete process.env.DB_PATH;
  });

  describe("GET /api/v1/hello", () => {
    test("should return 'Hello World'", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .get("/api/v1/hello")
        .expect(200);

      expect(response.text).toBe("Hello World");
    });
  });

  describe("GET /api/v1/add-session", () => {
    test("should create a new session and return sessionId", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .get("/api/v1/add-session")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("sessionId");
      expect(typeof response.body.sessionId).toBe("number");
      expect(response.body.sessionId).toBeGreaterThan(0);
    });

    test("should create multiple sessions with different IDs", async () => {
      const { default: app } = await import("../src/app.js");
      const response1 = await request(app)
        .get("/api/v1/add-session")
        .expect(200);

      const response2 = await request(app)
        .get("/api/v1/add-session")
        .expect(200);

      expect(response1.body.sessionId).not.toBe(response2.body.sessionId);
    });
  });

  describe("POST /api/v1/chats", () => {
    test("should add a chat message successfully", async () => {
      const { default: app } = await import("../src/app.js");
      // First create a session
      const sessionResponse = await request(app)
        .get("/api/v1/add-session")
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;

      // Add a chat
      const chatResponse = await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "user",
          content: "Hello, this is a test message",
        })
        .expect(200)
        .expect("Content-Type", /json/);

      expect(chatResponse.body).toHaveProperty("chatId");
      expect(typeof chatResponse.body.chatId).toBe("number");
      expect(chatResponse.body.chatId).toBeGreaterThan(0);
    });

    test("should return 400 if sessionId is missing", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .post("/api/v1/chats")
        .send({
          role: "user",
          content: "Test message",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required fields");
    });

    test("should return 400 if role is missing", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId: 1,
          content: "Test message",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required fields");
    });

    test("should return 400 if content is missing", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId: 1,
          role: "user",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Missing required fields");
    });

    test("should accept different roles", async () => {
      const { default: app } = await import("../src/app.js");
      const sessionResponse = await request(app)
        .get("/api/v1/add-session")
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;

      const roles = ["user", "assistant", "system"];
      for (const role of roles) {
        const response = await request(app)
          .post("/api/v1/chats")
          .send({
            sessionId,
            role,
            content: `Message with role ${role}`,
          })
          .expect(200);

        expect(response.body).toHaveProperty("chatId");
      }
    });
  });

  describe("GET /api/v1/chats/:sessionId", () => {
    test("should retrieve all chats for a session", async () => {
      const { default: app } = await import("../src/app.js");
      // Create a session
      const sessionResponse = await request(app)
        .get("/api/v1/add-session")
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;

      // Add multiple chats
      await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "user",
          content: "First message",
        })
        .expect(200);

      await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "assistant",
          content: "First response",
        })
        .expect(200);

      await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "user",
          content: "Second message",
        })
        .expect(200);

      // Retrieve chats
      const response = await request(app)
        .get(`/api/v1/chats/${sessionId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("session_id");
      expect(response.body[0]).toHaveProperty("role");
      expect(response.body[0]).toHaveProperty("content");
      expect(response.body[0]).toHaveProperty("created_at");
      expect(response.body[0].session_id).toBe(sessionId);
    });

    test("should return empty array for session with no chats", async () => {
      const { default: app } = await import("../src/app.js");
      // Create a session
      const sessionResponse = await request(app)
        .get("/api/v1/add-session")
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;

      // Retrieve chats (should be empty)
      const response = await request(app)
        .get(`/api/v1/chats/${sessionId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test("should return 400 for invalid sessionId", async () => {
      const { default: app } = await import("../src/app.js");
      const response = await request(app)
        .get("/api/v1/chats/abc")
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid sessionId");
    });

    test("should return chats ordered by created_at", async () => {
      const { default: app } = await import("../src/app.js");
      // Create a session
      const sessionResponse = await request(app)
        .get("/api/v1/add-session")
        .expect(200);
      const sessionId = sessionResponse.body.sessionId;

      // Add chats with small delays
      await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "user",
          content: "Message 1",
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post("/api/v1/chats")
        .send({
          sessionId,
          role: "user",
          content: "Message 2",
        })
        .expect(200);

      // Retrieve chats
      const response = await request(app)
        .get(`/api/v1/chats/${sessionId}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Verify ordering - first message should have smaller ID
      expect(response.body[0].id).toBeLessThan(response.body[1].id);
    });
  });
});

