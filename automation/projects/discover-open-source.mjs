import { fileURLToPath } from "node:url";
import path from "node:path";

const ownRepo = "dongyu19920904/BioAI-Content-Hub";
const issueTitle = "[项目候选] AI 延寿研究开源工具待核清单";
const marker = "<!-- bioai-open-source-discovery-v1 -->";
const known = new Set(["lucascamillomd/pyaging", "gangcai/scageclock"]);
const queries = [
  { q: "aging clock in:name,description language:Python archived:false fork:false", sort: "stars" },
  { q: "biological age in:name,description language:R archived:false fork:false", sort: "stars" },
  { q: "senescence in:name,description language:Python archived:false fork:false", sort: "stars" },
  { q: '"biological age" in:name,description archived:false fork:false', sort: "updated" },
];

function safeText(value, limit = 140) {
  return String(value || "")
    .replace(/[\r\n\t\x00-\x1f\x7f<>\[\]()|@]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function validSlug(value) {
  return /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}$/.test(value || "");
}

function candidateFromSearch(item, cutoff) {
  const slug = String(item?.full_name || "");
  const license = String(item?.license?.spdx_id || "");
  const description = safeText(item?.description);
  const topic = `${slug} ${description}`;
  if (!validSlug(slug) || known.has(slug.toLowerCase()) || item.private || item.archived || item.fork) return null;
  if (!description || !/(biolog|senescen|epigen|transcriptom|proteom|methylat|single.cell|longev|biomarker)/i.test(topic)) return null;
  if (/(virtual memory|page replacement|operating system|cpu scheduling|battery aging)/i.test(topic)) return null;
  if (!/^[A-Za-z0-9.+-]{2,64}$/.test(license) || license === "NOASSERTION") return null;
  const pushedAt = new Date(item.pushed_at || "");
  if (Number.isNaN(pushedAt.getTime()) || pushedAt < cutoff) return null;
  return {
    slug,
    url: `https://github.com/${slug}`,
    description,
    license,
    stars: Number.isSafeInteger(item.stargazers_count) ? item.stargazers_count : 0,
    pushed: /^\d{4}-\d{2}-\d{2}T/.test(item.pushed_at || "") ? item.pushed_at.slice(0, 10) : "未知",
  };
}

export async function runDiscovery(fetcher = fetch, token = "", now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 18);
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "BioAI-Content-Hub/project-discovery",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  async function request(route, method = "GET", body) {
    const response = await fetcher(`https://api.github.com${route}`, {
      method,
      headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`GitHub ${method} ${route.split("?")[0]}: HTTP ${response.status}`);
    return response.json();
  }

  const candidates = [];
  const seen = new Set();
  const failures = [];
  for (const query of queries) {
    try {
      const params = new URLSearchParams({ q: query.q, sort: query.sort, order: "desc", per_page: "20" });
      const result = await request(`/search/repositories?${params}`);
      if (!Array.isArray(result.items) || result.incomplete_results) throw new Error("incomplete search results");
      let added = 0;
      for (const item of result.items) {
        const candidate = candidateFromSearch(item, cutoff);
        if (!candidate || seen.has(candidate.slug.toLowerCase())) continue;
        seen.add(candidate.slug.toLowerCase());
        candidates.push(candidate);
        if (++added === 3) break;
      }
    } catch (error) {
      failures.push(`${query.q.split(" in:")[0]}: ${safeText(error.message, 80)}`);
    }
  }
  if (failures.length === queries.length) throw new Error("All project searches failed; keeping the previous queue");

  const withReadme = [];
  for (const candidate of candidates.slice(0, 12)) {
    try {
      const route = `/repos/${candidate.slug.split("/").map(encodeURIComponent).join("/")}/readme`;
      await request(route);
      withReadme.push(candidate);
    } catch {
      // README access or API failure means this is not yet an actionable candidate.
    }
    if (withReadme.length === 8) break;
  }
  if (!withReadme.length) return { status: "no_readable_candidates", searched: queries.length - failures.length, failures };

  const rows = withReadme.map((item, index) =>
    `| ${index + 1} | [${item.slug}](${item.url}) | ${item.description} | ${item.license}（GitHub 识别） | ${item.pushed} | ${item.stars} |`,
  );
  const body = `${marker}\n本清单由 GitHub 公开仓库搜索和 README 可读性检查生成，只展示最近 18 个月有代码推送记录的候选；最近检查于 ${now.toISOString().slice(0, 10)}。` +
    `**只是候选，不代表有真实需求、科学效力、可复现数据或商用许可。** 没有 clone、安装或执行下面的陌生代码。\n\n` +
    `| # | 仓库 | 仓库描述（原文元数据） | 许可证元数据 | 最近推送 | Star |\n| --- | --- | --- | --- | --- | ---: |\n` +
    `${rows.join("\n")}\n\n` +
    `## 下一步工作\n\n逐项核对原始 LICENSE、依赖协议、作者文档、公开样本、期望输出、运行资源和研究限制。` +
    `只选一个有明确中文读者任务且能安全复现的项目，固定提交，在低权限临时运行器试跑；成功或失败都记录真实运行链接。` +
    `之后才写实操内容、接网站入口和反馈。缺失上述证据时标为待核或拒绝，不强行部署。` +
    `本 Issue 的正文由自动发现任务维护，人工调查结果请写在评论或独立 Issue。` +
    (failures.length ? `\n\n搜索失败 ${failures.length}/${queries.length} 组，候选可能不完整；下次重试。` : "");

  let existing;
  for (let page = 1; page <= 5; page += 1) {
    const issues = await request(`/repos/${ownRepo}/issues?state=open&per_page=100&page=${page}`);
    if (!Array.isArray(issues)) throw new Error("Invalid issue list");
    existing = issues.find((issue) => !issue.pull_request && issue.title === issueTitle && String(issue.body || "").includes(marker));
    if (existing || issues.length < 100) break;
    if (page === 5) throw new Error("Too many open issues to verify uniqueness");
  }
  if (existing?.body === body) return { status: "unchanged", issue: existing.html_url, candidates: withReadme.length, failures };
  const route = existing ? `/repos/${ownRepo}/issues/${existing.number}` : `/repos/${ownRepo}/issues`;
  const issue = await request(route, existing ? "PATCH" : "POST", { title: issueTitle, body });
  return { status: existing ? "updated" : "created", issue: issue.html_url, candidates: withReadme.length, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runDiscovery(fetch, process.env.GITHUB_TOKEN || "");
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
