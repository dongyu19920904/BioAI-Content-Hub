import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const catalogUrl = new URL("../../src/data/openSourceCatalog.json", import.meta.url);
const allowedRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export async function refreshCatalog(catalog, fetchRepo, now = new Date()) {
  if (!Array.isArray(catalog.projects) || catalog.projects.length === 0 || catalog.projects.length > 30) {
    throw new Error("Invalid curated project list");
  }
  const updated = [];
  for (const project of catalog.projects) {
    const segments = project.repo.split("/");
    if (!allowedRepo.test(project.repo) || segments.some(segment => segment === "." || segment === "..")) {
      throw new Error(`Invalid repository: ${project.repo}`);
    }
    const response = await fetchRepo(project.repo);
    const expectedUrl = `https://github.com/${project.repo}`;
    if (
      response.full_name?.toLowerCase() !== project.repo.toLowerCase() ||
      response.html_url?.toLowerCase() !== expectedUrl.toLowerCase() ||
      response.license?.spdx_id !== project.github.license ||
      typeof response.archived !== "boolean" ||
      !/^\d{4}-\d\d-\d\dT/.test(response.pushed_at ?? "")
    ) {
      throw new Error(`Metadata or license changed for ${project.repo}; review before publishing`);
    }
    updated.push({
      ...project,
      github: {
        url: expectedUrl,
        license: response.license.spdx_id,
        archived: response.archived,
        pushed_at: response.pushed_at,
      },
    });
  }
  return { observed_at: now.toISOString(), projects: updated };
}

async function fetchGitHubRepo(repo) {
  const signal = AbortSignal.timeout(10000);
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    signal,
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "BioAI-Content-Hub-curated-catalog",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${repo}`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
  try {
    const next = await refreshCatalog(catalog, fetchGitHubRepo);
    await writeFile(catalogUrl, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    process.stdout.write(`已刷新 ${next.projects.length} 个开源仓库元数据；不改变人工核对的用途说明。\n`);
  } catch (error) {
    process.stderr.write(`开源工具元数据刷新失败；继续使用 ${catalog.observed_at} 的已核查快照：${error.message}\n`);
  }
}
