import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repository = "dongyu19920904/BioAI-Content-Hub";
const apiBase = "https://api.github.com";
const marker = "<!-- bioai-repo-preflight-v1 -->";
const titlePrefix = "[工具初筛]";
const fieldName = "公开 GitHub 仓库 URL";

export function parsePublicRepoUrl(body) {
  const field = String(body || "").match(/^### 公开 GitHub 仓库 URL\s*\r?\n+([^\r\n]+)/m)?.[1]?.trim();
  if (!field) return null;
  let url;
  try {
    url = new URL(field);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner)) return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo, slug: `${owner}/${repo}`, url: `https://github.com/${owner}/${repo}` };
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未知" : date.toISOString().slice(0, 10);
}

export function makeReport(target, metadata, hasReadme) {
  const license = /^[A-Za-z0-9.+-]{1,64}$/.test(metadata.license?.spdx_id || "")
    ? metadata.license.spdx_id
    : "GitHub 未识别";
  const size = Number.isSafeInteger(metadata.size) && metadata.size >= 0
    ? `${metadata.size.toLocaleString("en-US")} KiB（GitHub 仓库元数据，非运行内存）`
    : "未知";
  const warnings = [];
  if (metadata.archived === true) warnings.push("仓库已归档，后续维护可能不足；先确认是否有活跃替代项目。");
  if (license === "GitHub 未识别" || license === "NOASSERTION") warnings.push("尚未确认可复用许可证；在核对原始 LICENSE 和依赖协议前，不建议改造、再分发或商用。");
  if (!hasReadme) warnings.push("GitHub API 未找到 README，复现步骤和公开样本入口需要另查。");
  if (Number.isSafeInteger(metadata.size) && metadata.size > 1_000_000) warnings.push("仓库元数据超过约 1 GB，不适合未经资源预算核验就放进免费运行器试跑。");
  const next = warnings.length
    ? warnings.map((item) => `- ${item}`).join("\n")
    : "- 下一步先读 README、LICENSE、依赖和公开样本说明，再固定提交做隔离试跑；此报告没有证明软件可运行。";
  return `${marker}\n## 公开仓库自动初筛\n\n` +
    `仓库：[${target.slug}](${target.url})。这份报告只读 GitHub 公开元数据，**没有下载或运行仓库代码**，也没有使用个人健康数据。\n\n` +
    `| 检查 | 结果 |\n| --- | --- |\n` +
    `| GitHub 仓库状态 | ${metadata.archived === true ? "已归档" : "未归档"} |\n` +
    `| GitHub 识别的许可证 | ${license}；仍需核对原始 LICENSE 和依赖协议 |\n` +
    `| README | ${hasReadme ? "GitHub API 可读取" : "未找到"} |\n` +
    `| 最近代码推送 | ${safeDate(metadata.pushed_at)} |\n` +
    `| 仓库大小 | ${size} |\n\n` +
    `### 下一步\n\n${next}\n\n` +
    `若需要本站真正复现，请在此 Issue 补充**公开样本的位置、预期输出和你卡住的具体步骤**。我们会按许可证、资源和科学边界筛选；申请不保证自动执行陌生代码或交付医学结论。不要公开体检单、逐人数据、密钥、邮箱或付款信息。\n\n` +
    `初筛结果不是安全审计、科研验证、个人生物年龄测算或商业许可意见。`;
}

function errorReport() {
  return `${marker}\n## 暂时无法初筛\n\n请在「${fieldName}」填写一个**公开仓库首页**，格式如 https://github.com/lucascamillomd/pyaging ，不要填文件、分支、私有仓库、短链或含令牌的 URL。本站只读取公开 GitHub 仓库，不接收健康资料或密钥。`;
}

export async function handleIssueEvent(event, fetcher = fetch, token = "") {
  if (event?.action !== "opened" || event?.repository?.full_name !== repository) return { status: "ignored" };
  const issue = event.issue;
  if (!Number.isSafeInteger(issue?.number) || issue.number < 1 || issue.pull_request || !String(issue.title || "").startsWith(titlePrefix)) return { status: "ignored" };

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "BioAI-Content-Hub/repo-preflight",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  async function request(apiPath, method = "GET", body) {
    const response = await fetcher(`${apiBase}${apiPath}`, {
      method,
      headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    return response;
  }

  const commentsPath = `/repos/${repository}/issues/${issue.number}/comments`;
  for (let page = 1; page <= 5; page += 1) {
    const response = await request(`${commentsPath}?per_page=100&page=${page}`);
    if (!response.ok) throw new Error(`Cannot read existing comments: HTTP ${response.status}`);
    const comments = await response.json();
    if (!Array.isArray(comments)) throw new Error("Invalid comments response");
    if (comments.some((comment) => comment.user?.type === "Bot" && String(comment.body || "").includes(marker))) return { status: "already_reported", issue_number: issue.number };
    if (comments.length < 100) break;
    if (page === 5) throw new Error("Too many comments to verify idempotency");
  }

  const target = parsePublicRepoUrl(issue.body);
  let report = errorReport();
  if (target) {
    const repoPath = `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`;
    const response = await request(repoPath);
    if (response.status === 404) {
      report = `${marker}\n## 仓库暂不可读\n\nGitHub API 找不到这个公开仓库。请核对仓库首页 URL 和公开权限；不要贴私有仓库令牌或成员邀请。`;
    } else {
      if (!response.ok) throw new Error(`Cannot read public repository: HTTP ${response.status}`);
      const metadata = await response.json();
      if (metadata?.private === true || String(metadata?.full_name || "").toLowerCase() !== target.slug.toLowerCase()) throw new Error("Repository identity mismatch");
      const readme = await request(`${repoPath}/readme`);
      if (readme.status !== 200 && readme.status !== 404) throw new Error(`Cannot check README: HTTP ${readme.status}`);
      report = makeReport(target, metadata, readme.status === 200);
    }
  }

  const posted = await request(commentsPath, "POST", { body: report });
  if (!posted.ok) throw new Error(`Cannot post preflight report: HTTP ${posted.status}`);
  return { status: "reported", issue_number: issue.number, repo: target?.slug || null };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("GITHUB_EVENT_PATH is required");
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const result = await handleIssueEvent(event, fetch, process.env.GITHUB_TOKEN || "");
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
