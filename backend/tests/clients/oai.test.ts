// backend/tests/clients/oai.test.ts
import { describe, test, expect } from "@jest/globals";
import { MessageSchema, type Message } from "../../schemas/index.js";

describe("OAI client", () => {
    test("Should return schema-compliant output for simple input", async () => {
        const { infer } = await import("../../src/clients/oai.js");
        const inputs: Message[] = [{
            role: "user",
            content: "Hello, how are you?"
        }];
        const output = await infer(inputs);
        const result = MessageSchema.safeParse(output);
        expect(result.success).toBe(true);
    });

    test("Should return schema-compliant output for complex input", async () => {
        const { infer } = await import("../../src/clients/oai.js");
        const inputs: Message[] = [{
            role: "user",
            content: [
                { type: "input_text", text: "What is this image?" },
            ]
        }];
        const output = await infer(inputs);
        const result = MessageSchema.safeParse(output);
        expect(result.success).toBe(true);
    });
});
