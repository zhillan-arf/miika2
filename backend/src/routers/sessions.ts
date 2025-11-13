// backend/src/routers/sessions.ts
import express, { Router } from "express";
import { addSession } from "../db.js";

const router = Router();

router.get("/v1/sessions/:userId", (req: express.Request, res: express.Response) => {
  /**
   * Get session IDs belonging to a user
   * @param userId
   * @returns Session IDs
   */

});

router.post("/v1/sessions/:userId", (req: express.Request, res: express.Response) => {
  /**
   * User creates a new session, the session is created and the session ID is returned
   * @param userId
   * @returns The session ID
   */

});

export default router;