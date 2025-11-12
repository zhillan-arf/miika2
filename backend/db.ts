// backend/db.ts

import Database from "better-sqlite3";

// Initialize database connection
const db = new Database("database.db");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
`);

// Prepare statements for better performance
const insertSession = db.prepare("INSERT INTO sessions (created_at) VALUES (datetime('now'))");
const insertChat = db.prepare("INSERT INTO chats (session_id, role, content, created_at) VALUES (?, ?, ?, datetime('now'))");
const selectChats = db.prepare("SELECT * FROM chats WHERE session_id = ? ORDER BY created_at ASC");

// Export functions
export function addSession(): number {
  const result = insertSession.run();
  return Number(result.lastInsertRowid);
}

export function addChat(sessionId: number, role: string, content: string): number {
  const result = insertChat.run(sessionId, role, content);
  return Number(result.lastInsertRowid);
}

export function getChats(sessionId: number): Array<{
  id: number;
  session_id: number;
  role: string;
  content: string;
  created_at: string;
}> {
  return selectChats.all(sessionId) as Array<{
    id: number;
    session_id: number;
    role: string;
    content: string;
    created_at: string;
  }>;
}
