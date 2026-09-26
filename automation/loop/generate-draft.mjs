import fs from "node:fs/promises";
import path from "node:path";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ai-longevity-draft";
}

async function callModel(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = (process.env.ANTHROPIC_API_URL || "https://business.newcli.com").replace(/\/+$/, "");
  const model = process.env.DEFAULT_ANTHROPIC_MODEL || "claude-sonnet-5";

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 5000,
      temperature: 0.35,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Model API failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return Array.isArray(data.content)
    ? data.content.map(item => item.text || "").join("\n").trim()
    : "";
}

function buildPrompt(dailyContent, date) {
  return `你是 AI 延续学内容产品编辑。请从下面的商机日报中，选择一个最适合今天做成文章和资料包的主题。

硬规则：
- 不承诺诊断、治疗、抗衰、逆转疾病。
- 必须落到具体目标用户、文章标题、资料包交付物。
- 文章要像给普通人看的内容，不是日报摘要。

请只输出 Markdown，包含：
1. 推荐主题
2. 目标用户
3. 文章标题
4. 文章正文，带 frontmatter
5. 资料包草稿
6. 发布后验证动作

日期：${date}

日报内容：
${dailyContent}`;
}

const dailyPath = arg("daily");
const date = arg("date", new Date().toISOString().slice(0, 10));

if (!dailyPath) {
  process.stderr.write("Usage: node automation/loop/generate-draft.mjs --daily daily.md --date YYYY-MM-DD\n");
  process.exit(1);
}

const root = process.cwd();
const dailyContent = await fs.readFile(path.resolve(root, dailyPath), "utf8");
const output = await callModel(buildPrompt(dailyContent, date));
const runsDir = path.join(root, "automation", "runs");
await fs.mkdir(runsDir, { recursive: true });
await fs.writeFile(path.join(runsDir, `${date}.md`), output, "utf8");

const titleMatch = output.match(/^title:\s*["']?(.+?)["']?\s*$/m);
const title = titleMatch ? titleMatch[1] : `AI 延续学内容草稿 ${date}`;
const blogFile = path.join(root, "src", "data", "blog", `${slugify(title)}.md`);
await fs.writeFile(blogFile, output, "utf8");

process.stdout.write(`Draft written: ${blogFile}\n`);
process.stdout.write(`Run log written: ${path.join(runsDir, `${date}.md`)}\n`);
