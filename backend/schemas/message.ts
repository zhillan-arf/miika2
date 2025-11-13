// backend/schemas/message.ts
import { z } from "zod";

// Schemas
export const ContentItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    image_url: z.string(),
  }),
]);

export const MessageSchema = z.object({
  role: z.string(),
  content: z.union([
    z.string(),
    z.array(ContentItemSchema),
  ]),
});

// Types
export type Message = z.infer<typeof MessageSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;

