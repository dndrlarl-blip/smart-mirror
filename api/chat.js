import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const minimaxApiKey = process.env.MiniMax_LLM_API_KEY;
const minimaxBaseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io/v1';
const debug = process.env.DEBUG === 'true';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, session_id } = req.body; // messages: [{role, content}, ...], session_id from client

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
    }

    const systemPrompt = { role: 'system', content: '너는 친절한 AI 비서이다.' };
    // Ensure system prompt is first or implicitly handled. MiniMax usually accepts messages list.
    // We will prepend system prompt if not present? Or just add it.
    // The prompt says: System Prompt: "너는 친절한 AI 비서이다."

    const conversation = [systemPrompt, ...messages];
    // Note: If messages already has system, we might duplicate. Assuming client sends user/assistant history.

    const modelName = process.env.MINIMAX_MODEL_NAME || 'MiniMax-Text-01'; // 'abab5.5-chat' is common alias, but checking prompt requirement. Prompt: "MiniMax-Text-01"

    let attempts = 0;
    const maxRetries = 2; // Total 3 attempts
    const timeoutMs = 10000;

    let aiResponseContent = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let errorMsg = null;
    let status = 'success';
    const startTime = Date.now();

    try {
        const response = await retryCall(async () => {
            return axios.post(
                `${minimaxBaseUrl}/text/chatcompletion_v2`, // Endpoint verification needed. Common is /text/chatcompletion_v2 or similar. Assuming v2 based on "MiniMax-Text-01" usually implies recent.
                // Actually standard MiniMax API endpoint structure varies. 
                // V1: https://api.minimax.io/v1/text/chatcompletion_v2
                {
                    model: modelName,
                    messages: conversation,
                    tokens_to_generate: 1024,
                    temperature: 0.7,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${minimaxApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: timeoutMs,
                }
            );
        }, maxRetries);

        // MiniMax response structure parsing
        // Usually: data.choices[0].message.content
        // Usage: data.usage
        const data = response.data;
        if (data.choices && data.choices.length > 0) {
            aiResponseContent = data.choices[0].message.content;
        } else {
            // Fallback or error
            throw new Error('No choices in response');
        }

        if (data.usage) {
            usage = data.usage;
        } else {
            // Fallback calculation as per prompt
            usage.completion_tokens = aiResponseContent.length;
            // Approximation for prompt
            usage.prompt_tokens = JSON.stringify(conversation).length;
            usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;
        }

        res.status(200).json({
            role: 'assistant',
            content: aiResponseContent,
            usage: usage
        });

    } catch (err) {
        console.error('MiniMax API Error:', err);
        errorMsg = err.message;
        status = 'error';
        res.status(500).json({ error: 'Failed to fetch response after retries', details: err.message });
    } finally {
        // Logging to Supabase
        const endTime = Date.now();
        const latency = endTime - startTime;

        const lastUserMessage = messages[messages.length - 1];
        const userContent = lastUserMessage?.role === 'user' ? lastUserMessage.content : '(No user message)';

        try {
            const logData = {
                session_id: session_id || 'unknown',
                model_name: modelName,
                user_content: userContent,
                ai_content: aiResponseContent,
                prompt_tokens: usage.prompt_tokens || 0,
                completion_tokens: usage.completion_tokens || 0,
                total_tokens: usage.total_tokens || 0,
                latency_ms: latency,
                status: status,
                error_message: errorMsg
            };

            const { error: logError } = await supabase.from('chat_logs').insert([logData]);
            if (logError) console.error('Supabase Log Error:', logError);
        } catch (logErr) {
            console.error('Supabase Log Exception:', logErr);
        }
    }
}

async function retryCall(fn, retries) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            if (attempt > retries) throw error;
            console.log(`Retry attempt ${attempt}...`);
            await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
        }
    }
}
