// backend/src/db.ts
import "dotenv/config";
import Database from "better-sqlite3";
import type { User } from "../schemas/user.js";
import type { Session } from "../schemas/session.js";
import type { ChatInput, ChatOutput } from "../schemas/chat.js";
import type { Message } from "../schemas/message.js";

const DB_PATH = process.env.DB_PATH || "database.db";
const db = new Database(DB_PATH);

// Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    hash_password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`);

// Prep Statements
const insertUser = db.prepare(`
  INSERT INTO users (email, hash_password, created_at)
  VALUES (?, ?, datetime('now'))
`);

const deleteUserById = db.prepare(`
  DELETE FROM users WHERE id = ?
`);

const insertSession = db.prepare(`
  INSERT INTO sessions (user_id, created_at, updated_at)
  VALUES (?, datetime('now'), datetime('now'))
`);

const selectSessionsByUserId = db.prepare(`
  SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at ASC
`);

const updateSessionUpdatedAtStmt = db.prepare(`
  UPDATE sessions SET updated_at = datetime('now') WHERE id = ?
`);

const deleteSessionById = db.prepare(`
  DELETE FROM sessions WHERE id = ?
`);

const insertChat = db.prepare(`
  INSERT INTO chats (session_id, message, created_at)
  VALUES (?, ?, datetime('now'))
`);

const selectChatsBySessionId = db.prepare(`
  SELECT * FROM chats WHERE session_id = ? ORDER BY created_at ASC
`);

const selectChatById = db.prepare(`
  SELECT * FROM chats WHERE id = ?
`);

const deleteChatById = db.prepare(`
  DELETE FROM chats WHERE id = ?
`);

// User functions
export function createUser(email: string, hashPassword: string): number {
  const result = insertUser.run(email, hashPassword);
  return Number(result.lastInsertRowid);
}

export function deleteUser(userId: number): void {
  deleteUserById.run(userId);
}

// Session functions
export function createSession(userId: number): number {
  const result = insertSession.run(userId);
  return Number(result.lastInsertRowid);
}

export function getSessionsByUserId(userId: number): Session[] {
  const rows = selectSessionsByUserId.all(userId) as Array<{
    id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
  }>;
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function updateSessionUpdatedAt(sessionId: number): void {
  updateSessionUpdatedAtStmt.run(sessionId);
}

export function deleteSession(sessionId: number): void {
  deleteSessionById.run(sessionId);
}

// Chat functions
export function createChat(sessionId: number, message: Message): number {
  // Store the entire message as JSON since content can be string or array
  const messageJson = JSON.stringify(message);
  const result = insertChat.run(sessionId, messageJson);
  return Number(result.lastInsertRowid);
}

export function getChats(sessionId: number): ChatOutput[] {
  const rows = selectChatsBySessionId.all(sessionId) as Array<{
    id: number;
    session_id: number;
    message: string;
    created_at: string;
  }>;
  
  return rows.map(row => {
    // Parse the stored JSON message
    const message: Message = JSON.parse(row.message);
    return {
      id: row.id,
      sessionId: row.session_id,
      message: message,
      createdAt: row.created_at,
    };
  });
}

export function getChat(chatId: number): ChatOutput | null {
  const row = selectChatById.get(chatId) as {
    id: number;
    session_id: number;
    message: string;
    created_at: string;
  } | undefined;
  
  if (!row) {
    return null;
  }
  
  // Parse the stored JSON message
  const message: Message = JSON.parse(row.message);
  return {
    id: row.id,
    sessionId: row.session_id,
    message: message,
    createdAt: row.created_at,
  };
}

export function deleteChat(chatId: number): void {
  deleteChatById.run(chatId);
}

export function closeDb(): void {
  db.close();
}
