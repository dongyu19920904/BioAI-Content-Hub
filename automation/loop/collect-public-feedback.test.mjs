import test from "node:test";
import assert from "node:assert/strict";
import { summarizeProjectDownloads, summarizePublicFeedback } from "./collect-public-feedback.mjs";

test("counts only labeled opportunity issues without copying personal text", () => {
  const issues = [
    { number: 1, title: "[机会反馈] opp_0123456789abcdef", state: "open", labels: [{ name: "opportunity-feedback" }], body: "secret health detail", user: { login: "private-user" } },
    { number: 2, title: "[机会反馈] opp_0123456789abcdef", state: "closed", labels: [{ name: "opportunity-feedback" }] },
    { number: 3, title: "[机会反馈] opp_aaaaaaaaaaaaaaaa", state: "open", labels: [] },
    { number: 4, title: "[机会反馈] opp_bbbbbbbbbbbbbbbb", state: "open", labels: [{ name: "opportunity-feedback" }], pull_request: {} },
  ];
  const report = summarizePublicFeedback(issues, "2026-09-26T00:00:00Z");
  assert.deepEqual(report.opportunities, [{ opportunity_id: "opp_0123456789abcdef", reported_issue_count: 2, open_issue_count: 1, closed_issue_count: 1 }]);
  assert.doesNotMatch(JSON.stringify(report), /secret health detail|private-user/);
});

test("counts only the published article's reproduction reports without copying personal text", () => {
  const articleIssues = [
    { number: 7, title: "[文章复现反馈] pyaging-public-data-reproduction-guide 安装失败", state: "open", labels: [{ name: "documentation" }], body: "private health details", user: { login: "private-user" } },
    { number: 8, title: "[文章复现反馈] pyaging-public-data-reproduction-guide 版本问题", state: "closed", labels: [{ name: "documentation" }] },
    { number: 9, title: "[文章复现反馈] pyaging-public-data-reproduction-guide 未标记", state: "open", labels: [] },
    { number: 10, title: "[文章复现反馈] another-article", state: "open", labels: [{ name: "documentation" }] },
    { number: 11, title: "[文章复现反馈] pyaging-public-data-reproduction-guide PR", state: "open", labels: [{ name: "documentation" }], pull_request: {} },
  ];
  const report = summarizePublicFeedback([], "2026-09-29T00:00:00Z", [], articleIssues);
  assert.equal(report.schema_version, 2);
  assert.deepEqual(report.articles, [{ article_slug: "pyaging-public-data-reproduction-guide", reported_issue_count: 2, open_issue_count: 1, closed_issue_count: 1 }]);
  assert.doesNotMatch(JSON.stringify(report), /private health details|private-user/);
});

test("counts only both named published project assets, not users or plays", () => {
  const pyagingRelease = {
    tag_name: "pyaging-public-video-v1",
    html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/tag/pyaging-public-video-v1",
    assets: [{ name: "pyaging-public-demo-zh.mp4", state: "uploaded", download_count: 3, browser_download_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/download/pyaging-public-video-v1/pyaging-public-demo-zh.mp4", uploader: { login: "private-user" } }],
  };
  const scageclockRelease = {
    tag_name: "scageclock-public-video-v1",
    html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/tag/scageclock-public-video-v1",
    assets: [{ name: "scageclock-public-demo-zh.mp4", state: "uploaded", download_count: 2, browser_download_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/download/scageclock-public-video-v1/scageclock-public-demo-zh.mp4", uploader: { login: "another-private-user" } }],
  };
  const downloads = summarizeProjectDownloads([scageclockRelease, pyagingRelease]);
  assert.equal(downloads.length, 2);
  assert.equal(downloads[0].project_id, "project_c0f43537a4a2f2df");
  assert.equal(downloads[0].asset_download_count, 3);
  assert.equal(downloads[1].project_id, "project_79a96a9435e2033c");
  assert.equal(downloads[1].asset_download_count, 2);
  assert.equal(downloads[0].metric_scope, "asset_downloads_not_unique_people_or_plays");
  assert.doesNotMatch(JSON.stringify(downloads), /private-user|another-private-user/);
  assert.throws(() => summarizeProjectDownloads([pyagingRelease]));
  assert.throws(() => summarizeProjectDownloads([pyagingRelease, pyagingRelease]));
  assert.throws(() => summarizeProjectDownloads([{ ...pyagingRelease, tag_name: "wrong" }, scageclockRelease]));
  assert.throws(() => summarizeProjectDownloads([{ ...pyagingRelease, assets: [] }, scageclockRelease]));
});
