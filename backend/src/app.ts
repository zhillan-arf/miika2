// backend/src/app.ts
import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { addSession, addChat, getChats } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = JSON.parse(
  readFileSync(join(__dirname, "swagger.json"), "utf-8")
);


// Initialize Express app 
const app = express();

// Middleware for JSON parsing and Swagger UI
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// API endpoints
// app.get("/api/v1/hello", (req: express.Request, res: express.Response) => {
//   res.send("Hello World");
// });

// app.get("/api/v1/add-session", (req: express.Request, res: express.Response) => {
//   const sessionId = addSession();
//   res.json({ sessionId });
// });

// app.post("/api/v1/chats", (req: express.Request, res: express.Response) => {
//   /**
//    * Accepts a chat, construct prompt, infer response, save to DB, return response
//    */
//   const { sessionId, role, content } = req.body;
//   if (!sessionId || !role || !content) {
//     return res.status(400).json({ error: "Missing required fields: sessionId, role, or content" });
//   }
//   const chatId = addChat(sessionId, role, content);
//   res.json({ chatId });
// });

// app.get("/api/v1/chats/:sessionId", (req: express.Request, res: express.Response) => {
//   const sessionIdParam = req.params.sessionId;
//   if (!sessionIdParam) {
//     return res.status(400).json({ error: "Invalid sessionId" });
//   }
//   const sessionId = parseInt(sessionIdParam);
//   if (isNaN(sessionId)) {
//     return res.status(400).json({ error: "Invalid sessionId" });
//   }
//   const chats = getChats(sessionId);
//   res.json(chats);
// });


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Export Express app
export default app;
