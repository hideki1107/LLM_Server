export default async function handler(req, res) {
  // CORS（とりあえず全許可）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Bad Request", detail: "`text` is required" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "failed", detail: "OPENAI_API_KEY is not set" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "あなたは入力テキストからNEWS/LIVE投稿用の情報を抽出して、指定のJSONだけを返します。説明文やコードフェンスは一切出力しません。"
          },
          {
            role: "user",
            content:
              `次の内容を、管理画面で扱える形式のJSONに整理してください。\n\n` +
              `${text}\n\n` +
              `必ず次の形式のJSON“だけ”を返してください（前後に文字を出さない）:\n` +
              `{\n` +
              `  "date": "YYYYMMDD または YYYYMMDDHHMM",\n` +
              `  "title": "タイトル",\n` +
              `  "detail": "詳細(複数行可)"\n` +
              `}\n\n` +
              `制約:\n` +
              `- date は数字のみ（8桁 or 12桁）\n` +
              `- title は短く\n` +
              `- detail は必要なら改行してよい\n` +
              `- title/detail には絵文字を含めてもよい\n` +
              `- detail にはHTMLタグ（例: <br>, <strong>, <a>）を含めてもよい\n` +
              `- ただし出力は必ず正しいJSON文字列にする（HTML中の " は必要に応じてエスケープ）\n`
          }
        ],
        // JSONだけを返させる（対応モデルの場合）
        text: { format: { type: "json_object" } }
      })
    });

    const data = await response.json();
    // OpenAI APIの返却(JSON)を加工せずそのまま返す
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "failed", detail: e.message });
  }
}
