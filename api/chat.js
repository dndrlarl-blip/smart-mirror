export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLsobDshLHtmLgiLCJVc2VyTmFtZSI6IuyhsOyEse2YuCIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTMwNDY4OTc2NzY5MzcyNjkyIiwiUGhvbmUiOiIiLCJHcm91cElEIjoiMTkzMDQ2ODk3Njc1MjU5NTQ3NiIsIlBhZ2VOYW1lIjoiIiwiTWFpbCI6InNoYWluMTkxMkBnbWFpbC5jb20iLCJDcmVhdGVUaW1lIjoiMjAyNS0xMS0xMSAxNzozNzozOSIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.ZSETgeKKWyivl2ve0lVQMtaW0DTuqEhR04QprS65MQxdcnc-cFNZTn-iCGc1OikC4ITiN5zhcg1z90eLKjGTUJiIEGhIV4jXlKpG1y9HPBBrqg5NBRfmHBkq4WTtlyUthsqn8NvwRzE-eN-ht9Rn_I1DL70t3iGfflleidi40oeEaTHXtD7VlqO8lJ7oGAaZCuCIvils7HkPyPtafeFG8mgdaEbXLYuAr8tIvYz3jmFE80mbjNfCsqBHoBQTawCpsDms1zBnn7HxrAk_fREGYxgygJ-UzU7VPkZrYE5iuYKNNYy2JWekxsSr5mONHGiPw95Jn2WvBwb13gLUqtEDqg";
  const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
  // Use model from body or default
  const modelName = model || process.env.MINIMAX_MODEL_NAME || 'abab6.5s-chat';

  try {
    const response = await fetch(`${baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: false, // For simplicity in this MVP
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('MiniMax API Error:', response.status, errorText);
        return res.status(response.status).json({ error: `MiniMax API Error: ${errorText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
