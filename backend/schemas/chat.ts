// backend/schemas/chat.ts
import { z } from "zod";
import { MessageSchema } from "./message.js";

// Schemas
export const ChatInputSchema = z.object({
  sessionId: z.number().int(),
  message: MessageSchema,
});

export const ChatOutputSchema = z.object({
  id: z.number().int(),
  sessionId: z.number().int(),
  message: MessageSchema,
  createdAt: z.iso.datetime(),
});

// Types
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

