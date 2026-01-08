
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ekburueukqsdhzykzijx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TlfC61p9zr2Nj8MVFavizQ_xg4S2qbD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MINIMAX_URL = 'https://api.minimax.io/v1/text/chatcompletion_v2';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`
};

const TIMEOUT_MS = 30000; // 30 seconds

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries) throw error;
      // Simple backoff
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const payload = {
      model: "abab5.5-chat", // Or "MiniMax-M1" depending on key access
      messages: messages,
      stream: false,
      max_tokens: 256,
      temperature: 0.7,
      top_p: 0.95,
    };

    // 1. Call MiniMax API
    const data = await fetchWithRetry(MINIMAX_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    const reply = data.choices[0].message.content;
    const usage = data.usage || {};

    // 2. Log to Supabase
    // Attempting to log, but not failing the request if logging fails
    try {
      const { error } = await supabase
        .from('chat_logs')
        .insert([
          {
            user_message: messages[messages.length - 1].content,
            bot_response: reply,
            total_tokens: usage.total_tokens || 0,
            prompt_tokens: usage.prompt_tokens || 0,
            completion_tokens: usage.completion_tokens || 0,
            raw_usage: JSON.stringify(usage)
          }
        ]);
      if (error) console.error('Supabase Log Error:', error);
    } catch (logErr) {
      console.error('Supabase Exception:', logErr);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: reply,
        usage: usage
      }),
    };

  } catch (error) {
    console.error('Handler Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process chat',
        details: error.message
      }),
    };
  }
};