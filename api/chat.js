export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const apiKey = process.env.MiniMax_LLM_API_KEY;
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
