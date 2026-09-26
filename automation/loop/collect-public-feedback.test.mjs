import test from "node:test";
import assert from "node:assert/strict";
import { summarizePublicFeedback } from "./collect-public-feedback.mjs";

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
