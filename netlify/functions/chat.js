// netlify/functions/chat.js

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing MINIMAX_API_KEY' }) };
    }

    try {
        const { messages } = JSON.parse(event.body);

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

        // 🔴 수정됨: GroupId 파라미터 삭제 (기본값 사용)
        const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("MiniMax API Error:", errorText); // 로그에 에러 출력
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (err) {
        console.error("Function execution error:", err);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: err.message })
        };
    }
};