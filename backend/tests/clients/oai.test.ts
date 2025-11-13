// backend/tests/clients/oai.test.ts
import { describe, test, expect } from "@jest/globals";
import { MessageSchema } from "../../schemas/index.js";

describe("OAI client", () => {
    test("Should return schema-compliant output for simple input", async () => {
        const { infer } = await import("../../src/clients/oai.js");
        const input = {
            role: "user",
            content: "Hello, how are you?"
        };
        const output = await infer(JSON.stringify(input));  // TEMP
        const result = MessageSchema.safeParse(output);
        expect(result.success).toBe(true);
    });

    test("Should return schema-compliant output for complex input", async () => {
        const { infer } = await import("../../src/clients/oai.js");
        const input = {
            role: "user",
            content: [
                { type: "text", text: "What is this image?" },
                { type: "image", image_url: "https://example.com/image.jpg" }
            ]
        };
        const output = await infer(JSON.stringify(input));  // TEMP
        const result = MessageSchema.safeParse(output);
        expect(result.success).toBe(true);
    });
});
