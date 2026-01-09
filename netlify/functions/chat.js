// netlify/functions/chat.js

export const handler = async (event, context) => {
    // 1. POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // 2. Netlify 환경 변수에서 OpenAI API 키 가져오기
    // (주의: Netlify 설정에서 변수명을 OPENAI_API_KEY 로 새로 등록해야 합니다!)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error("Error: Missing OPENAI_API_KEY");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: Missing API Key' })
        };
    }

    try {
        const { messages } = JSON.parse(event.body);

        // 3. OpenAI 요청 데이터 구성
        const payload = {
            model: "gpt-4o-mini", // 또는 "gpt-3.5-turbo", "gpt-4o"
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                ...messages
            ],
            max_tokens: 1000, // OpenAI는 'tokens_to_generate' 대신 'max_tokens'를 씁니다.
            temperature: 0.7,
        };

        // 4. OpenAI API 호출
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        // 에러 처리
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API Error:", errorText);
            throw new Error(`OpenAI responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // 5. 프론트엔드로 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (err) {
        console.error("Function execution error:", err);
        return {
            statusCode: 502,
            body: JSON.stringify({ error: "Failed to fetch response from OpenAI", details: err.message })
        };
    }
};