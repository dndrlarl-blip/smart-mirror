import fetch from 'node-fetch';

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { messages } = JSON.parse(event.body);
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        // For local dev without env var, we might want to warn or mock, but better to fail safely
        return { statusCode: 500, body: 'Missing MINIMAX_API_KEY' };
    }

    const payload = {
        model: "abab5.5-chat",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            ...messages
        ],
        tokens_to_generate: 1024,
        temperature: 0.9,
        top_p: 0.95,
    };

    let attempts = 0;
    let maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=YOUR_GROUP_ID", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                statusCode: 200,
                body: JSON.stringify(data)
            };

        } catch (err) {
            lastError = err;
            attempts++;
            console.log(`Attempt ${attempts} failed: ${err.message}`);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return {
        statusCode: 502,
        body: JSON.stringify({ error: "Failed after retries", details: lastError?.message })
    };
};
