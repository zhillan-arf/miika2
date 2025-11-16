// backend/schemas/user.ts
import { z } from "zod";

// Schemas
export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  hash_password: z.string(),
  created_at: z.iso.datetime(),
});

// Types
export type User = z.infer<typeof UserSchema>;