import { createClient } from '@supabase/supabase-js';

// These will be loaded from .env in production, but for now we might need to hardcode or expect them to be available via import.meta.env
// The user provided keys in the prompt.
// I will use import.meta.env for safety and instruct user to set them, preventing accidental commit of keys if they use git.
// However, to make it work out of the box for the "makeathon", I might stick them in .env now.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const logUsage = async (
    model: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    success: boolean,
    errorMessage?: string
) => {
    try {
        const { error } = await supabase
            .from('chat_logs')
            .insert([
                {
                    model,
                    prompt_tokens: promptTokens,
                    completion_tokens: completionTokens,
                    total_tokens: totalTokens,
                    success,
                    error_message: errorMessage
                },
            ]);

        if (error) {
            console.error('Supabase Logging Error:', error);
        }
    } catch (err) {
        console.error('Supabase Logging Exception:', err);
    }
};
