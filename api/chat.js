export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJLUiBLb2RlS29yZWEiLCJVc2VyTmFtZSI6IktSIEtvZGVLb3JlYSIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTMyNzg4MDg5OTQwMzQ5MzI0IiwiUGhvbmUiOiIiLCJHcm91cElEIjoiMTkzMjc4ODA4OTkzMTk2MDcxNiIsIlBhZ2VOYW1lIjoiIiwiTWFpbCI6InNlb25naG8ua29kZWtvcmVhQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTExLTExIDE3OjQzOjU0IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.cpxH6Txzw_wQwkGmq8JSJ2DYgymUE1L1FuzkyqqlQ18hOeD0JVb0E1bOIkWeja7NPEGRnse0U1RFeJF5ilE8MkGpKcRU4yEdQXu6xpyX295f0EpvG9v4bsksSB53bIZnCKA47GO1WbEtveqNF6FU_CFFvEySwF15xTh5vhUbJYddQHK7NhWAiK5octYKuB3h40w4GxRO9cYFM26ur_MVB5dBx0j9cJ5Uh7DagLjllhkP03cerQ1Ym3lk3Lvo0fXu_YsJ7lS9bkMsoSPHTD6cJaAL783EDeyYNX0ehBJezWS9Mqa2l75MDH6nA7eJTV8RLvEWPv6OI9mpsDjWEHgMlw";
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
