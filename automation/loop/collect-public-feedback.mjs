import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const source = "https://api.github.com/repos/dongyu19920904/BioAI-Daily-Web/issues";
const articleIssueSource = "https://api.github.com/repos/dongyu19920904/BioAI-Content-Hub/issues";
const releaseApi = "https://api.github.com/repos/dongyu19920904/BioAI-Content-Hub/releases/tags/";
const releasePage = "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/";
const publishedProjects = [
  { projectId: "project_c0f43537a4a2f2df", tag: "pyaging-public-video-v1", assetName: "pyaging-public-demo-zh.mp4" },
  { projectId: "project_79a96a9435e2033c", tag: "scageclock-public-video-v1", assetName: "scageclock-public-demo-zh.mp4" },
];
const opportunityPattern = /^\[机会反馈\]\s+(opp_[a-f0-9]{16})(?:\b|$)/;
const articlePattern = /^\[文章复现反馈\]\s+(pyaging-public-data-reproduction-guide)(?:\b|$)/;

export function summarizeProjectDownloads(releases) {
  if (!Array.isArray(releases) || releases.length !== publishedProjects.length) throw new Error("Unexpected number of project releases");
  const byTag = new Map(releases.map((release) => [release?.tag_name, release]));
  if (byTag.size !== publishedProjects.length) throw new Error("Duplicate project release");
  return publishedProjects.map(({ projectId, tag, assetName }) => {
    const release = byTag.get(tag);
    if (release?.html_url !== `${releasePage}tag/${tag}`) throw new Error("Unexpected project release identity");
    const asset = release.assets?.find((item) => item.name === assetName && item.state === "uploaded");
    if (!asset || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0 || asset.browser_download_url !== `${releasePage}download/${tag}/${assetName}`) {
      throw new Error("Missing or invalid public video download count");
    }
    return { project_id: projectId, release_url: release.html_url, asset_url: asset.browser_download_url, asset_download_count: asset.download_count, metric_scope: "asset_downloads_not_unique_people_or_plays" };
  });
}

/** Public issue counts are unverified reports, never user or revenue measurements. */
export function summarizePublicFeedback(issues, generatedAt, projectDownloads = [], articleIssues = []) {
  const byOpportunity = new Map();
  for (const issue of issues) {
    if (issue.pull_request || !issue.labels?.some((label) => label.name === "opportunity-feedback")) continue;
    const id = String(issue.title || "").match(opportunityPattern)?.[1];
    if (!id || !Number.isSafeInteger(issue.number)) continue;
    const item = byOpportunity.get(id) || { opportunity_id: id, reported_issue_count: 0, open_issue_count: 0, closed_issue_count: 0 };
    item.reported_issue_count += 1;
    if (issue.state === "open") item.open_issue_count += 1;
    if (issue.state === "closed") item.closed_issue_count += 1;
    byOpportunity.set(id, item);
  }
  const byArticle = new Map();
  for (const issue of articleIssues) {
    if (issue.pull_request || !issue.labels?.some((label) => label.name === "documentation")) continue;
    const slug = String(issue.title || "").match(articlePattern)?.[1];
    if (!slug || !Number.isSafeInteger(issue.number)) continue;
    const item = byArticle.get(slug) || { article_slug: slug, reported_issue_count: 0, open_issue_count: 0, closed_issue_count: 0 };
    item.reported_issue_count += 1;
    if (issue.state === "open") item.open_issue_count += 1;
    if (issue.state === "closed") item.closed_issue_count += 1;
    byArticle.set(slug, item);
  }
  return {
    schema_version: 2,
    generated_at: generatedAt,
    source: "public_github_issues_and_release_api",
    caveat_zh: "仅统计指定标签和编号/文章标识的公开 Issue；文章反馈数不是阅读量或独立读者。视频下载次数可能含自动请求，不代表独立用户、完整观看、付费或疗效。正文、用户名和个人资料不进入本文件。",
    opportunities: [...byOpportunity.values()].sort((a, b) => a.opportunity_id.localeCompare(b.opportunity_id)),
    articles: [...byArticle.values()].sort((a, b) => a.article_slug.localeCompare(b.article_slug)),
    project_downloads: projectDownloads,
  };
}

async function fetchIssues(baseUrl, label, fetcher = fetch) {
  const token = process.env.GITHUB_TOKEN;
  const issues = [];
  for (let page = 1; page <= 5; page += 1) {
    const url = `${baseUrl}?labels=${label}&state=all&per_page=100&page=${page}`;
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "BioAI-Content-Hub/1.0",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub feedback API failed: HTTP ${response.status}`);
    const pageIssues = await response.json();
    if (!Array.isArray(pageIssues)) throw new Error("Unexpected GitHub issues response");
    issues.push(...pageIssues);
    if (pageIssues.length < 100) break;
  }
  return issues;
}

async function fetchProjectReleases(fetcher = fetch) {
  const token = process.env.GITHUB_TOKEN;
  return Promise.all(publishedProjects.map(async ({ tag }) => {
    const response = await fetcher(`${releaseApi}${tag}`, {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "BioAI-Content-Hub/1.0",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error(`GitHub release API failed for ${tag}: HTTP ${response.status}`);
    return response.json();
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [issues, articleIssues, releases] = await Promise.all([
    fetchIssues(source, "opportunity-feedback"),
    fetchIssues(articleIssueSource, "documentation"),
    fetchProjectReleases(),
  ]);
  const report = summarizePublicFeedback(issues, new Date().toISOString(), summarizeProjectDownloads(releases), articleIssues);
  const output = path.join(root, "automation/runs/feedback/public-issue-summary.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ opportunity_count: report.opportunities.length, reported_issue_count: report.opportunities.reduce((sum, item) => sum + item.reported_issue_count, 0), article_feedback: report.articles.map((item) => ({ article_slug: item.article_slug, reported_issue_count: item.reported_issue_count })), project_downloads: report.project_downloads.map((item) => ({ project_id: item.project_id, asset_download_count: item.asset_download_count })) })}\n`);
}
