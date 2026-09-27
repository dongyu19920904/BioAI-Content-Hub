import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidencePack } from "./evidence-pack.mjs";

const input = {
  opportunity_id: "opp_0123456789abcdef", title: "MIND 饮食资料包", source_urls: ["https://medicalxpress.com/news/example.html"],
  primary_source_candidates: [{ doi: "10.1002/alz.71772" }],
  source_verified: false, demand_verified: false, risk_flags: ["health_claim_review"],
};
const page = "https://news.aibioo.cn/opportunity/2026-09/2026-09-26/";

test("unverified evidence creates consistent drafts but blocks publication", () => {
  const result = buildEvidencePack(input, page);
  assert.equal(result.gate.status, "blocked_from_publication");
  assert.equal(result.files.storyboard.render_status, "not_rendered");
  for (const text of [result.files.website, result.files.wechat, result.files.bilibili]) {
    assert.match(text, /opp_0123456789abcdef/);
    assert.match(text, /https:\/\/doi.org\/10.1002\/alz.71772/);
    assert.doesNotMatch(text, /已证实延寿|治疗有效/);
  }
  for (const [channel, draft] of Object.entries({ website: result.files.website, wechat: result.files.wechat, bilibili: result.files.bilibili })) {
    const url = new URL(result.attribution_urls[channel]);
    assert.equal(url.searchParams.get("utm_source"), channel);
    assert.equal(url.searchParams.get("utm_campaign"), input.opportunity_id);
    assert.match(draft, new RegExp(`utm_source=${channel}`));
    assert.match(draft, /issues\/new\?template=opportunity-feedback.md/);
  }
});

test("verified claims may enter channel authorization, not pretend to be published", () => {
  const record = { ...input, source_verified: true, health_claim_review_passed: true, primary_source_candidates: [{ doi: "10.1002/alz.71772", url: "https://doi.org/10.1002/alz.71772", relationship_verified: true }], verified_claims: [{ text: "研究对象与方法已核查；尚未证明延长人类寿命。", source_url: "https://doi.org/10.1002/alz.71772" }] };
  const result = buildEvidencePack(record, page);
  assert.equal(result.gate.status, "ready_for_channel_authorization");
  assert.match(result.files.website, /尚未证明延长人类寿命/);
  assert.equal("published_url" in result, false);
});

test("health claims cannot pass using only a news URL or an unverified DOI relationship", () => {
  const record = { ...input, source_verified: true, health_claim_review_passed: true, verified_claims: [{ text: "研究对象已核查。", source_url: input.source_urls[0] }] };
  const newsOnly = buildEvidencePack(record, page);
  assert.equal(newsOnly.gate.status, "blocked_from_publication");
  assert.match(newsOnly.gate.reasons.join(" "), /一手论文来源/);
  const doiOnly = buildEvidencePack({ ...record, verified_claims: [{ text: "研究对象已核查。", source_url: "https://doi.org/10.1002/alz.71772" }] }, page);
  assert.equal(doiOnly.gate.status, "blocked_from_publication");
  assert.match(doiOnly.gate.reasons.join(" "), /一手论文来源/);
});

test("non-health source rules remain unchanged", () => {
  const record = { ...input, risk_flags: [], source_verified: true, verified_claims: [{ text: "项目仓库已核查。", source_url: input.source_urls[0] }] };
  assert.equal(buildEvidencePack(record, page).gate.status, "ready_for_channel_authorization");
});

test("invalid records fail closed", () => {
  assert.throws(() => buildEvidencePack({ ...input, opportunity_id: "bad" }, page));
  assert.throws(() => buildEvidencePack(input, "http://127.0.0.1/"));
});
