// netlify/functions/chat.js

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 👇 1. Groq 키를 가져옵니다. (Netlify에 GROQ_API_KEY 등록 필수)
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Missing GROQ_API_KEY' }) };
    }

    try {
        const { messages } = JSON.parse(event.body);

        const payload = {
            // 👇 2. 모델명을 Groq에서 제공하는 무료 모델로 변경 (Llama 3 8B)
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                ...messages
            ],
            // max_tokens: 1000, // 필요하면 주석 해제
            temperature: 0.7,
        };

        // 👇 3. 요청 주소(URL)를 Groq로 변경
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);
            throw new Error(`Groq responded with ${response.status}: ${errorText}`);
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
            body: JSON.stringify({ error: "Failed to fetch response", details: err.message })
        };
    }
};