// netlify/functions/chat.js

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.MINIMAX_API_KEY;

    console.log(`Key Length: ${apiKey ? apiKey.length : 0}`);
    console.log(`Key Check: [${apiKey}]`); // 대괄호로 감싸서 공백 유무 확인

    if (!apiKey) {
        console.error("API Key missing");
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing MINIMAX_API_KEY' }) };
    }

    try {
        const { messages } = JSON.parse(event.body);
        console.log("Input messages:", JSON.stringify(messages)); // 1. 내가 보낸 메시지 확인

        // MiniMax API 엔드포인트 (v1 호환)
        const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "abab5.5-chat",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    ...messages
                ],
                tokens_to_generate: 1024,
                temperature: 0.9,
            })
        });

        // 응답을 텍스트로 먼저 받아서 로그로 찍어봅니다.
        const responseText = await response.text();
        console.log("MiniMax Raw Response:", responseText); // 2. MiniMax가 보낸 진짜 답변 확인

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${responseText}`);
        }

        return {
            statusCode: 200,
            body: responseText // 그대로 프론트엔드에 전달
        };

    } catch (err) {
        console.error("Function Error:", err);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: err.message })
        };
    }
};