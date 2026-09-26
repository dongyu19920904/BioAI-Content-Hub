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

test("counts only the named published project asset, not users or plays", () => {
  const release = {
    tag_name: "pyaging-public-video-v1",
    html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/tag/pyaging-public-video-v1",
    assets: [{ name: "pyaging-public-demo-zh.mp4", state: "uploaded", download_count: 3, browser_download_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/releases/download/pyaging-public-video-v1/pyaging-public-demo-zh.mp4", uploader: { login: "private-user" } }],
  };
  const downloads = summarizeProjectDownloads(release);
  assert.equal(downloads[0].asset_download_count, 3);
  assert.equal(downloads[0].metric_scope, "asset_downloads_not_unique_people_or_plays");
  assert.doesNotMatch(JSON.stringify(downloads), /private-user/);
  assert.throws(() => summarizeProjectDownloads({ ...release, tag_name: "wrong" }));
  assert.throws(() => summarizeProjectDownloads({ ...release, assets: [] }));
});
