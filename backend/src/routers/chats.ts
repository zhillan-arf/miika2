// backend/src/routers/chats.ts
import express, { Router } from "express";
import { addChat } from "../db.js";

const router = Router();

router.get("/v1/chats/:sessionId", (req: express.Request, res: express.Response) => {
  /**
   * Get all chats for a session
   * @param sessionId
   * @returns Chats
   */

});

router.post("/v1/chats", (req: express.Request, res: express.Response) => {
  /**
   * Accepts a chat, construct prompt, infer response, save to DB, return response
   */

});

export default router;