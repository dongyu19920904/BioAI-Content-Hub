import test from "node:test";
import assert from "node:assert/strict";
import { handleIssueEvent, makeReport, parsePublicRepoUrl } from "./repo-preflight.mjs";

const event = {
  action: "opened",
  repository: { full_name: "dongyu19920904/BioAI-Content-Hub" },
  issue: {
    number: 27,
    title: "[工具初筛] pyaging",
    body: "### 公开 GitHub 仓库 URL\n\nhttps://github.com/lucascamillomd/pyaging\n\n### 你最想解决什么问题\n\n想找到公开样本和复现步骤",
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

test("accepts only a public GitHub repository homepage", () => {
  assert.deepEqual(parsePublicRepoUrl(event.issue.body), {
    owner: "lucascamillomd",
    repo: "pyaging",
    slug: "lucascamillomd/pyaging",
    url: "https://github.com/lucascamillomd/pyaging",
  });
  for (const candidate of [
    "http://github.com/a/b",
    "https://github.com.evil.test/a/b",
    "https://github.com/a/b/tree/main",
    "https://github.com/a/b?token=secret",
    "https://user:pass@github.com/a/b",
    "https://github.com/a/b#readme",
    "https://github.com/a",
    "https://github.com/a/b/../../evil",
  ]) {
    assert.equal(parsePublicRepoUrl(`### 公开 GitHub 仓库 URL\n\n${candidate}`), null, candidate);
  }
});

test("reports limits without claiming software, medical or license verification", () => {
  const target = parsePublicRepoUrl(event.issue.body);
  const report = makeReport(target, { archived: true, size: 1_500_000, pushed_at: "2026-09-20T00:00:00Z", license: null }, false);
  assert.match(report, /已归档/);
  assert.match(report, /GitHub 未识别/);
  assert.match(report, /README/);
  assert.match(report, /没有下载或运行仓库代码/);
  assert.match(report, /不是安全审计/);
  assert.doesNotMatch(report, /已验证可用|安全可靠|能延长寿命/);
});

test("posts one report for a valid public repository and skips duplicate runs", async () => {
  const calls = [];
  let botComment = null;
  const fetcher = async (url, options) => {
    calls.push({ url, method: options.method, body: options.body });
    if (url.includes("/issues/27/comments?") ) return json(botComment ? [botComment] : []);
    if (url.endsWith("/repos/lucascamillomd/pyaging")) return json({ full_name: "lucascamillomd/pyaging", private: false, archived: false, size: 241, pushed_at: "2026-09-25T08:27:58Z", license: { spdx_id: "MIT" } });
    if (url.endsWith("/repos/lucascamillomd/pyaging/readme")) return json({ name: "README.md" });
    if (url.endsWith("/issues/27/comments") && options.method === "POST") {
      botComment = { user: { type: "Bot" }, body: JSON.parse(options.body).body };
      return json({ id: 100 }, 201);
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  assert.deepEqual(await handleIssueEvent(event, fetcher, "test-token"), { status: "reported", issue_number: 27, repo: "lucascamillomd/pyaging" });
  assert.match(botComment.body, /MIT/);
  assert.match(botComment.body, /没有下载或运行仓库代码/);
  assert.deepEqual(await handleIssueEvent(event, fetcher, "test-token"), { status: "already_reported", issue_number: 27 });
  assert.equal(calls.filter((call) => call.method === "POST").length, 1);
  assert.equal(calls.every((call) => call.url.startsWith("https://api.github.com/")), true);
});

test("invalid or private input gets a safe explanation, not a code execution", async () => {
  const posted = [];
  const fetcher = async (url, options) => {
    if (options.method === "POST") {
      posted.push(JSON.parse(options.body).body);
      return json({ id: 101 }, 201);
    }
    if (url.includes("/issues/27/comments?")) return json([]);
    throw new Error(`Unexpected external fetch: ${url}`);
  };
  const invalidEvent = { ...event, issue: { ...event.issue, body: "### 公开 GitHub 仓库 URL\n\nhttps://private.example.org/secret" } };
  assert.deepEqual(await handleIssueEvent(invalidEvent, fetcher), { status: "reported", issue_number: 27, repo: null });
  assert.equal(posted.length, 1);
  assert.match(posted[0], /公开仓库首页/);
  assert.doesNotMatch(posted[0], /private\.example/);
});

test("ignores unrelated issues and fails closed on API errors", async () => {
  assert.deepEqual(await handleIssueEvent({ ...event, issue: { ...event.issue, title: "普通提问" } }, async () => { throw new Error("should not fetch"); }), { status: "ignored" });
  const fetcher = async (url) => {
    if (url.includes("/issues/27/comments?")) return json([]);
    return json({ message: "rate limited" }, 403);
  };
  await assert.rejects(handleIssueEvent(event, fetcher), /HTTP 403/);
});
