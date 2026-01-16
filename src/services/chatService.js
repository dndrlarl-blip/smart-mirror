import { supabase } from './supabase';

const API_ENDPOINT = '/api/chat';
const TIMEOUT_MS = 20000; // 20 seconds timeout
const RETRY_COUNT = 2; // 2 retries (total 3 attempts)

export const sendMessageToAI = async (messages, sessionId, modelName = 'abab6.5s-chat') => {
    let attempts = 0;

    while (attempts <= RETRY_COUNT) {
        const startTime = Date.now();
        try {
            const result = await fetchWithTimeout(messages, modelName);
            const endTime = Date.now();
            const latency = endTime - startTime;

            const aiContent = result.choices?.[0]?.message?.content || "";
            const usage = result.usage;

            // Log success
            // Not awaiting log to avoid blocking UI, but catching errors inside
            logChat(sessionId, modelName, messages, aiContent, usage, latency, 'success').catch(console.error);

            return result;
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
            attempts++;

            if (attempts > RETRY_COUNT) {
                const endTime = Date.now();
                const latency = endTime - startTime;
                // Log failure
                logChat(sessionId, modelName, messages, null, null, latency, 'error', error.message).catch(console.error);
                throw error;
            }
            // Optional: wait before retry
            await new Promise(res => setTimeout(res, 1000));
        }
    }
};

const fetchWithTimeout = async (messages, model) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, model }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} - ${text}`);
        }

        return await response.json();
    } finally {
        clearTimeout(id);
    }
};

const logChat = async (sessionId, modelName, messages, aiContent, usage, latency, status, errorMessage = null) => {
    try {
        // Get the last user message
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        const userContent = lastUserMessage ? lastUserMessage.content : '';

        const promptTokens = usage?.total_tokens ? usage.prompt_tokens : userContent.length; // Fallback to char length if no usage
        const completionTokens = usage?.total_tokens ? usage.completion_tokens : (aiContent ? aiContent.length : 0);
        const totalTokens = usage?.total_tokens ? usage.total_tokens : (promptTokens + completionTokens);

        const { error } = await supabase.from('chat_logs').insert({
            session_id: sessionId,
            model_name: modelName,
            user_content: userContent,
            ai_content: aiContent,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            latency_ms: latency,
            status: status,
            error_message: errorMessage
        });

        if (error) {
            console.error('Supabase Log Error:', error);
        }
    } catch (e) {
        console.error('Logging logic failed:', e);
    }
};
