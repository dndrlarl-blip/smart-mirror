// netlify/functions/chat.js

export const handler = async (event, context) => {
    // 1. GET 요청 등은 거절하고 오직 POST만 받습니다.
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. 환경 변수에서 API 키를 가져옵니다. (Netlify 설정에 저장해둔 값)
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing MINIMAX_API_KEY' }) };
    }

    try {
        const { messages } = JSON.parse(event.body);

        // 3. MiniMax API 요청 데이터 구성
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

        // ⚠️ 중요: GroupId를 실제 ID로 바꾸거나, 필요 없다면 파라미터를 지워야 합니다.
        // 만약 Group ID를 모른다면 URL을 "https://api.minimax.chat/v1/text/chatcompletion_pro" 까지만 쓰세요.
        const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=YOUR_GROUP_ID", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (err) {
        console.error("Function error:", err);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: "Failed to fetch response", details: err.message })
        };
    }
};