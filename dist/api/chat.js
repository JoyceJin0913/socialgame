// Vercel Serverless Function: 代理 DeepSeek Chat API
// 环境变量：DEEPSEEK_API_KEY

export default async function handler(req, res) {
  // CORS（同源也建议加上）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: '未配置 DEEPSEEK_API_KEY，请前往 Vercel Project Settings → Environment Variables 添加。'
    });
  }

  try {
    const { messages, temperature = 0.85, max_tokens = 400 } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' });
    }

    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: 'DeepSeek API 错误', detail: errText });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ reply, usage: data.usage });
  } catch (err) {
    return res.status(500).json({ error: '服务器错误', detail: String(err) });
  }
}
