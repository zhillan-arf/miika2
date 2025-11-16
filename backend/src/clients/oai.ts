// backend/src/oai.ts
import "dotenv/config";
import { OpenAI } from "openai/client.js";
import type { ResponseInputItem } from 'openai/resources/responses/responses.mjs'
import type { Message } from "../../schemas/message.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

const oaiClient = new OpenAI();


// Main Function
export async function infer(inputs: Message[]): Promise<any> {
    /**
     * Infer the response from the input using the OpenAI API.
     * Currently only supports text input.
     * @param - Structured OAI input (text or complex content)
     * @returns Structured OAI output (text or complex content)
     */

    const response = await oaiClient.responses.create({
        model: OPENAI_MODEL || "gpt-4",
        input: inputs
    });

    return response.output;

}