const RUNTOKEN_HOST = "www.runtoken.ai";

export function messagesUrl(raw = `https://${RUNTOKEN_HOST}`) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.hostname !== RUNTOKEN_HOST || url.port || url.username || url.password || url.search || url.hash) {
    throw new Error("AI 接口只允许已配置的 RunToken HTTPS 端点，且不得在 URL 中携带凭据。");
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "" && path !== "/v1" && path !== "/v1/messages") {
    throw new Error("RunToken Anthropic 接口路径必须为根地址、/v1 或 /v1/messages。");
  }
  url.pathname = "/v1/messages";
  return url.toString();
}

export async function callRunToken(prompt, { env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = env.RUNTOKEN_API_KEY?.trim();
  if (!apiKey) throw new Error("缺少 RUNTOKEN_API_KEY；不要把密钥写进仓库或聊天。");
  const endpoint = messagesUrl(env.ANTHROPIC_API_URL || `https://${RUNTOKEN_HOST}`);
  const primary = env.DEFAULT_ANTHROPIC_MODEL || "claude-sonnet-5";
  const backup = env.DEFAULT_ANTHROPIC_BACKUP_MODEL || "claude-opus-4-8";
  const models = [...new Set([primary, backup])];

  for (const [index, model] of models.entries()) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 5000,
          temperature: 0.35,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });
    } catch {
      if (index < models.length - 1) continue;
      throw new Error("RunToken 网络请求失败；草稿未生成。");
    }
    if (!response.ok) {
      if (index < models.length - 1 && [404, 429, 500, 502, 503, 504].includes(response.status)) continue;
      throw new Error(`RunToken 返回 HTTP ${response.status}；草稿未生成。`);
    }
    const data = await response.json();
    const output = Array.isArray(data.content)
      ? data.content.filter(item => item.type === "text" && typeof item.text === "string").map(item => item.text).join("\n").trim()
      : "";
    if (!output) throw new Error("RunToken 未返回可用文字；草稿未生成。");
    return output;
  }
  throw new Error("RunToken 主、备模型均不可用；草稿未生成。");
}
