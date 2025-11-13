// backend/tests/db.test.ts
import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { unlinkSync, existsSync } from "fs";

// Use a test database file (unique to db tests)
const TEST_DB_PATH = "test-db-functions.db";

describe("Database Functions", () => {
  beforeAll(() => {
    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      try {
        unlinkSync(TEST_DB_PATH);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    // Set environment variable for this test run
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

  describe("addSession", () => {
    test("Should create a new session and return session ID", async () => {
      // Dynamic import to get fresh module with test DB
      const { addSession } = await import("../src/db.js");
      const sessionId = addSession();
      
      expect(sessionId).toBeGreaterThan(0);
      expect(typeof sessionId).toBe("number");
    });

    test("should create multiple sessions with unique IDs", async () => {
      const { addSession } = await import("../src/db.js");
      const sessionId1 = addSession();
      const sessionId2 = addSession();
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId2).toBeGreaterThan(sessionId1);
    });
  });

  describe("addChat", () => {
    test("should add a chat message to a session", async () => {
      const { addSession, addChat } = await import("../src/db.js");
      
      // First create a session
      const sessionId = addSession();
      expect(sessionId).toBeGreaterThan(0);

      // Add a chat
      const chatId = addChat(sessionId, "user", "Hello, world!");
      
      expect(chatId).toBeGreaterThan(0);
      expect(typeof chatId).toBe("number");
    });

    test("should add multiple chats to the same session", async () => {
      const { addSession, addChat } = await import("../src/db.js");
      
      const sessionId = addSession();
      
      const chatId1 = addChat(sessionId, "user", "Message 1");
      const chatId2 = addChat(sessionId, "assistant", "Response 1");
      const chatId3 = addChat(sessionId, "user", "Message 2");
      
      expect(chatId1).toBeGreaterThan(0);
      expect(chatId2).toBeGreaterThan(chatId1);
      expect(chatId3).toBeGreaterThan(chatId2);
    });

    test("should handle different roles", async () => {
      const { addSession, addChat } = await import("../src/db.js");
      
      const sessionId = addSession();
      const roles = ["user", "assistant", "system"];
      
      roles.forEach(role => {
        const chatId = addChat(sessionId, role, `Message with role ${role}`);
        expect(chatId).toBeGreaterThan(0);
      });
    });
  });

  describe("getChats", () => {
    test("should retrieve all chats for a session", async () => {
      const { addSession, addChat, getChats } = await import("../src/db.js");
      
      const sessionId = addSession();
      
      // Add multiple chats
      addChat(sessionId, "user", "First message");
      addChat(sessionId, "assistant", "First response");
      addChat(sessionId, "user", "Second message");
      
      // Retrieve chats
      const chats = getChats(sessionId);
      
      expect(Array.isArray(chats)).toBe(true);
      expect(chats).toHaveLength(3);
      expect(chats[0]).toBeDefined();
      if (chats[0]) {
        expect(chats[0]).toHaveProperty("id");
        expect(chats[0]).toHaveProperty("session_id");
        expect(chats[0]).toHaveProperty("role");
        expect(chats[0]).toHaveProperty("content");
        expect(chats[0]).toHaveProperty("created_at");
        expect(chats[0].session_id).toBe(sessionId);
      }
    });

    test("should return empty array for session with no chats", async () => {
      const { addSession, getChats } = await import("../src/db.js");
      
      const sessionId = addSession();
      const chats = getChats(sessionId);
      
      expect(Array.isArray(chats)).toBe(true);
      expect(chats).toHaveLength(0);
    });

    test("should return chats ordered by created_at ascending", async () => {
      const { addSession, addChat, getChats } = await import("../src/db.js");
      
      const sessionId = addSession();
      
      // Add chats
      addChat(sessionId, "user", "Message 1");
      addChat(sessionId, "user", "Message 2");
      addChat(sessionId, "user", "Message 3");
      
      // Retrieve chats
      const chats = getChats(sessionId);
      
      expect(chats).toHaveLength(3);
      // Verify ordering by checking IDs (which should be sequential)
      expect(chats[0]).toBeDefined();
      expect(chats[1]).toBeDefined();
      expect(chats[2]).toBeDefined();
      if (chats[0] && chats[1] && chats[2]) {
        expect(chats[0].id).toBeLessThan(chats[1].id);
        expect(chats[1].id).toBeLessThan(chats[2].id);
        expect(chats[0].content).toBe("Message 1");
        expect(chats[1].content).toBe("Message 2");
        expect(chats[2].content).toBe("Message 3");
      }
    });

    test("should only return chats for the specified session", async () => {
      const { addSession, addChat, getChats } = await import("../src/db.js");
      
      const sessionId1 = addSession();
      const sessionId2 = addSession();
      
      // Add chats to both sessions
      addChat(sessionId1, "user", "Session 1 message");
      addChat(sessionId2, "user", "Session 2 message");
      addChat(sessionId1, "assistant", "Session 1 response");
      
      // Retrieve chats for session 1
      const chats1 = getChats(sessionId1);
      expect(chats1).toHaveLength(2);
      expect(chats1.every(chat => chat.session_id === sessionId1)).toBe(true);
      
      // Retrieve chats for session 2
      const chats2 = getChats(sessionId2);
      expect(chats2).toHaveLength(1);
      expect(chats2[0]?.session_id).toBe(sessionId2);
    });
  });
});
