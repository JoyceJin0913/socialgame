// Vercel Serverless Function: 代理 DeepSeek Chat API
// 环境变量：DEEPSEEK_API_KEY

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "未配置 DEEPSEEK_API_KEY" });
  }

  const { messages, temperature = 0.85, max_tokens = 400, stream = false } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 不能为空" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature, max_tokens, stream }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: "DeepSeek API 错误", detail: errText });
    }

    if (stream && upstream.body) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      return res.end();
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ reply, usage: data?.usage });
  } catch (err) {
    return res.status(502).json({ error: "上游调用失败", detail: String(err?.message ?? err) });
  }
}
