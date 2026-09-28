const apiBase = "https://api.github.com";

export function parseRepoUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
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
  )
    return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner))
    return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo) || repo === "." || repo === "..")
    return null;
  return { owner, repo, slug: `${owner}/${repo}` };
}

export async function checkPublicRepo(raw, fetcher = fetch) {
  const target = parseRepoUrl(raw);
  if (!target)
    throw new Error(
      "请填写公开仓库首页，例如 https://github.com/lucascamillomd/pyaging 。不要包含分支、文件、参数或令牌。"
    );
  const path = `/repos/${encodeURIComponent(target.owner)}/${encodeURIComponent(target.repo)}`;
  const options = {
    headers: { Accept: "application/vnd.github+json" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  };
  const response = await fetcher(`${apiBase}${path}`, options);
  if (response.status === 404)
    throw new Error("GitHub 未找到这个公开仓库，请核对地址和公开权限。");
  if (response.status === 403 || response.status === 429)
    throw new Error(
      "GitHub 公开 API 暂时限流，请稍后重试；也可以使用下方公开 Issue 申请入口。"
    );
  if (!response.ok)
    throw new Error(
      `GitHub API 暂不可用（HTTP ${response.status}），请稍后重试。`
    );
  const data = await response.json();
  if (
    data?.private === true ||
    String(data?.full_name || "").toLowerCase() !== target.slug.toLowerCase()
  ) {
    throw new Error("仓库身份与输入地址不一致；为避免误判，本次不显示报告。");
  }
  const readme = await fetcher(`${apiBase}${path}/readme`, options);
  if (readme.status === 403 || readme.status === 429)
    throw new Error(
      "GitHub 公开 API 暂时限流，README 状态未核实，请稍后重试。"
    );
  if (readme.status !== 200 && readme.status !== 404)
    throw new Error(
      `README 状态暂不可用（HTTP ${readme.status}），请稍后重试。`
    );
  const license = /^[A-Za-z0-9.+-]{1,64}$/.test(data.license?.spdx_id || "")
    ? data.license.spdx_id
    : "GitHub 未识别";
  const warnings = [];
  if (data.archived === true)
    warnings.push("仓库已归档，请先确认维护状态或替代项目。");
  if (license === "GitHub 未识别" || license === "NOASSERTION")
    warnings.push(
      "许可证未确认：使用、改造或再分发前请核对原始 LICENSE 和依赖协议。"
    );
  if (readme.status === 404)
    warnings.push("GitHub API 未找到 README，请另查复现说明与公开样本。");
  if (Number.isSafeInteger(data.size) && data.size > 1_000_000)
    warnings.push("仓库元数据超过约 1 GB，试跑前需要资源预算。");
  const pushDate = data.pushed_at ? new Date(data.pushed_at) : new Date(NaN);
  return {
    slug: target.slug,
    url: `https://github.com/${target.slug}`,
    archived: data.archived === true ? "已归档" : "未归档",
    license,
    readme: readme.status === 200 ? "GitHub API 可读取" : "未找到",
    pushed: Number.isNaN(pushDate.getTime())
      ? "未知"
      : pushDate.toISOString().slice(0, 10),
    size:
      Number.isSafeInteger(data.size) && data.size >= 0
        ? `${data.size.toLocaleString("en-US")} KiB`
        : "未知",
    warnings,
  };
}
