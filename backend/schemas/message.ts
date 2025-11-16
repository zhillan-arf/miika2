// backend/schemas/message.ts
import { z } from "zod";

/**
 * Currently compatible with OpenAI's ResponseInputContent type.
 * @see https://platform.openai.com/docs/api-reference/responses/create#responses/create-input.content
 * Only supports text input for now.
 */

// Schemas
export const RoleSchema = z.enum([
    "user", 
    "assistant", 
    "system", 
    "developer"
]);

export const ContentItemTextSchema = z.object({
    type: z.literal("input_text"),
    text: z.string(),
  });
  
export const ContentItemSchema = z.discriminatedUnion("type", [
ContentItemTextSchema
]);

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.union([
    z.string(),
    z.array(ContentItemSchema),
  ]),
});

// Types
export type Message = z.infer<typeof MessageSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;

