// backend/schemas/session.ts
import { z } from "zod";

// Schemas
export const SessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

// Types
export type Session = z.infer<typeof SessionSchema>;