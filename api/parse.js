export default async function handler(req, res) {
  // CORS（とりあえず全許可）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `以下をJSONで整理してください:
        
${text}

出力形式:
{
  "summary": "...",
  "keywords": ["...", "..."]
}`
      })
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "failed", detail: e.message });
  }
}
