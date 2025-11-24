// backend/src/clients/oai.ts
import "dotenv/config";
import { OpenAI } from "openai/client.js";
import type { Message } from "../../schemas/message.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const TIMEOUT_MS = 60000;

// Error classes
export class OAIError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = "OAIError";
    }
}

export class OAIIncompleteError extends OAIError {
    constructor(message: string, public incompleteDetails: unknown) {
        super(message, "INCOMPLETE");
        this.name = "OAIIncompleteError";
    }
}

export class OAICredentialsError extends OAIError {
    constructor(message: string = "Invalid OpenAI API credentials") {
        super(message, "INVALID_CREDENTIALS", 401);
        this.name = "OAICredentialsError";
    }
}

export class OAIServiceUnavailableError extends OAIError {
    constructor(message: string = "OpenAI service cannot be reached") {
        super(message, "SERVICE_UNAVAILABLE", 503);
        this.name = "OAIServiceUnavailableError";
    }
}

export class OAITimeoutError extends OAIError {
    constructor(message: string = `Request timed out after ${TIMEOUT_MS}ms`) {
        super(message, "TIMEOUT");
        this.name = "OAITimeoutError";
    }
}

export class OAITokenLimitError extends OAIError {
    constructor(message: string = "Token limit exceeded") {
        super(message, "TOKEN_LIMIT_EXCEEDED", 400);
        this.name = "OAITokenLimitError";
    }
}

export class OAIInvalidModelError extends OAIError {
    constructor(message: string = "Invalid model version") {
        super(message, "INVALID_MODEL", 400);
        this.name = "OAIInvalidModelError";
    }
}

const oaiClient = new OpenAI();

// Helper function to parse OpenAI response output into Message[]
function parseResponseOutput(output: any[]): Message[] {
    const messages: Message[] = [];

    for (const item of output) {
        if (item.type === "message" && item.role && item.content) {
            // Check if content is an array of content items
            if (Array.isArray(item.content)) {
                // Extract text from output_text content items
                const textParts: string[] = [];
                for (const contentItem of item.content) {
                    if (contentItem.type === "output_text" && contentItem.text) {
                        textParts.push(contentItem.text);
                    }
                }
                // Combine all text parts into a single string
                messages.push({
                    role: item.role,
                    content: textParts.join(" "),
                });
            } else if (typeof item.content === "string") {
                // Simple string content
                messages.push({
                    role: item.role,
                    content: item.content,
                });
            }
        }
    }

    return messages;
}

// Helper function to handle OpenAI API errors
function handleOpenAIError(error: any): never {
    // Check for authentication/authorization errors
    if (error?.status === 401 || error?.message?.includes("authentication") || error?.message?.includes("Invalid API key")) {
        throw new OAICredentialsError();
    }

    // Check for service unavailable errors
    if (error?.status === 503 || error?.status === 502 || error?.status === 504) {
        throw new OAIServiceUnavailableError();
    }

    // Check for timeout errors
    if (error?.code === "ETIMEDOUT" || error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
        throw new OAITimeoutError();
    }

    // Check for token limit errors
    if (error?.status === 400 && (error?.message?.includes("token") || error?.message?.includes("context_length"))) {
        throw new OAITokenLimitError(error.message);
    }

    // Check for invalid model errors
    if (error?.status === 400 && (error?.message?.includes("model") || error?.message?.includes("Invalid model"))) {
        throw new OAIInvalidModelError(error.message);
    }

    // Generic OpenAI API error
    throw new OAIError(
        error?.message || "OpenAI API error",
        "OPENAI_API_ERROR",
        error?.status
    );
}

// Main Function
export async function infer(inputs: Message[]): Promise<Message[]> {
    /**
     * Infer the response from the input using the OpenAI API.
     * Currently only support text input.
     * @param inputs - Message array
     * @returns Message array
     * @throws {OAICredentialsError} When credentials are invalid
     * @throws {OAIServiceUnavailableError} When OAI service cannot be reached
     * @throws {OAITimeoutError} When request times out
     * @throws {OAITokenLimitError} When token limit is exceeded
     * @throws {OAIInvalidModelError} When model version is invalid
     * @throws {OAIIncompleteError} When response is incomplete
     * @throws {OAIError} For other OpenAI API errors
     */
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new OAITimeoutError());
            }, TIMEOUT_MS);
        });

        // Race between the API call and timeout
        const response = await Promise.race([
            oaiClient.responses.create({
                model: OPENAI_MODEL || "gpt-4",
                input: inputs,
            }),
            timeoutPromise,
        ]);

        // Check for error in response
        if (response.error) {
            const errorMessage = response.error.message || "OpenAI API returned an error";
            const errorCode = response.error.code || "UNKNOWN_ERROR";
            // ResponseError may not have status, so we check safely
            const statusCode = "status" in response.error ? (response.error as any).status : undefined;
            throw new OAIError(errorMessage, errorCode, statusCode);
        }

        // Check for incomplete details
        if (response.incomplete_details) {
            throw new OAIIncompleteError(
                "Response is incomplete",
                response.incomplete_details
            );
        }

        // Check if output exists
        if (!response.output || !Array.isArray(response.output)) {
            throw new OAIError("Invalid response format: missing output array", "INVALID_RESPONSE");
        }

        // Check each output item's status (only for message types that have status)
        for (const outputItem of response.output) {
            // Check if this is a message output item with a status property
            if (outputItem && typeof outputItem === "object" && "type" in outputItem && outputItem.type === "message") {
                const messageItem = outputItem as any;
                if ("status" in messageItem && messageItem.status && messageItem.status !== "completed") {
                    throw new OAIError(
                        `Output item status is not completed: ${messageItem.status}`,
                        "INCOMPLETE_OUTPUT",
                        undefined
                    );
                }
            }
        }

        // Parse and return the messages
        const messages = parseResponseOutput(response.output);
        
        if (messages.length === 0) {
            throw new OAIError("No messages found in response output", "NO_MESSAGES");
        }

        return messages;
    } catch (error) {
        // If it's already one of our custom errors, re-throw it
        if (error instanceof OAIError) {
            throw error;
        }

        // Handle OpenAI SDK errors
        if (error && typeof error === "object" && "status" in error) {
            handleOpenAIError(error);
        }

        // Handle network errors
        if (error instanceof Error) {
            if (error.message.includes("fetch") || error.message.includes("network")) {
                throw new OAIServiceUnavailableError(error.message);
            }
        }

        // Generic error fallback
        throw new OAIError(
            error instanceof Error ? error.message : "Unknown error occurred",
            "UNKNOWN_ERROR"
        );
    }
}


export async function simpleInfer(inputs: Message[]): Promise<any> {
    /**
     * For testing purposes only.
     * @param inputs - Message array
     * @returns Output text or null if error occurs
     */
    try {
        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new OAITimeoutError());
            }, 10000);
        });

        // Race between the API call and timeout
        const response = await Promise.race([
            oaiClient.responses.create({
                model: OPENAI_MODEL || "gpt-4",
                input: inputs,
            }),
            timeoutPromise,
        ]);

        // Parse and return the messages
        return response.output_text; 

    } catch (error) {
        console.error(error);
        return null;
    }
}