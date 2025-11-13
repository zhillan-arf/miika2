// backend/src/oai.ts
import "dotenv/config";
import { OpenAI } from "openai/client.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

// Functions
export async function infer(input: string): Promise<any[]> {
    /**
     * Infer the response from the input using the OpenAI API
     * @param input - Structured OAI input (incl. role, content type & text)
     * @returns Structured OAI output (incl. role, content type & text)
     */
    const response = await openai.responses.create({
        // WIP
    });

    return response.output;
}