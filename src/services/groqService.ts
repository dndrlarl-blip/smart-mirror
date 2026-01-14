import Groq from 'groq-sdk';
import { logUsage } from './supabaseClient';

// Initialize Groq SDK
// Note: Client-side usage of Groq SDK with API key requires 'dangerouslyAllowBrowser: true'
// This is not recommended for production apps but for a hackathon web app without backend proxy it's acceptable if the key is restricted (or user accepts risk).
// The user asked for a web app without a backend server specified (Vite only), so client-side is implied.

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
});

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const sendMessageToGroq = async (
    messages: ChatMessage[],
    onRetry?: (attempt: number) => void
): Promise<string> => {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 10000;
    const MODEL = 'llama3-8b-8192'; // Standard fast model

    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0 && onRetry) onRetry(attempt);

        try {
            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS);
            });

            // Api call promise
            const apiCallPromise = groq.chat.completions.create({
                messages: messages,
                model: MODEL,
                temperature: 0.7,
                max_tokens: 1024,
            });

            // Race them
            const chatCompletion = await Promise.race([apiCallPromise, timeoutPromise]) as Groq.Chat.Completions.ChatCompletion;

            // Extract usage
            const usage = chatCompletion.usage;
            const content = chatCompletion.choices[0]?.message?.content || "";

            // Log success
            if (usage) {
                await logUsage(MODEL, usage.prompt_tokens, usage.completion_tokens, usage.total_tokens, true);
            } else {
                // Fallback logging if usage not returned
                await logUsage(MODEL, JSON.stringify(messages).length, content.length, 0, true);
            }

            return content;

        } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            lastError = error;
            // If it's the last attempt
            if (attempt === MAX_RETRIES) {
                await logUsage(MODEL, 0, 0, 0, false, error.message || 'Unknown Error');
                throw error;
            }
            // Wait a bit before retry? (exponential backoff optional, but let's do simple delay)
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    throw lastError;
};
