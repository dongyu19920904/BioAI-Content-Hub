import test from "node:test";
import assert from "node:assert/strict";
import { reconcileRelatedSources } from "./reconcile-related-sources.mjs";

const article = "https://lifespan.io/creatine-protects-lean-mass-even-without-exercise/";
const doi = "10.1080/15502783.2026.2716273";
const articleCandidate = { doi, url: `https://doi.org/${doi}`, discovered_from: article, relationship_verified: false };
const opportunity = {
  schema_version: 1, report_date: "2026-09-26", report_section: "opportunity",
  opportunities: [{ opportunity_id: "opp_f59847f61d9ee4d6", source_urls: [article], source_verified: false, demand_verified: false, primary_source_candidates: [articleCandidate] }],
};
const project = {
  schema_version: 1, report_date: "2026-09-26", report_section: "project-opportunity",
  opportunities: [{ opportunity_id: "opp_a07c4f698979ac76", source_urls: [article], source_verified: false, demand_verified: false, primary_source_candidates: [] }],
};

test("same article shares DOI as a candidate but never shares verification", () => {
  const result = reconcileRelatedSources(project, opportunity);
  const record = result.opportunities[0];
  assert.deepEqual(record.related_opportunity_ids, ["opp_f59847f61d9ee4d6"]);
  assert.equal(record.primary_source_candidates[0].doi, doi);
  assert.equal(record.primary_source_candidates[0].shared_candidate_from, "opp_f59847f61d9ee4d6");
  assert.equal(record.primary_source_candidates[0].relationship_verified, false);
  assert.equal(record.source_verified, false);
  assert.equal(record.demand_verified, false);
  assert.deepEqual(project.opportunities[0].primary_source_candidates, []);
  assert.equal(reconcileRelatedSources(project, opportunity).opportunities[0].primary_source_candidates.length, 1);
});

test("unrelated URLs, dates and sections cannot be cross-linked", () => {
  const unrelated = { ...project, opportunities: [{ ...project.opportunities[0], source_urls: ["https://example.org/other"] }] };
  assert.deepEqual(reconcileRelatedSources(unrelated, opportunity).opportunities[0].related_opportunity_ids, []);
  assert.deepEqual(reconcileRelatedSources(unrelated, opportunity).opportunities[0].primary_source_candidates, []);
  assert.throws(() => reconcileRelatedSources(project, { ...opportunity, report_date: "2026-09-27" }), /other section for the same date/);
  assert.throws(() => reconcileRelatedSources(project, { ...opportunity, report_section: "project-opportunity" }), /other section for the same date/);
});

test("a DOI from another article or malformed candidate is not imported", () => {
  const poisoned = { ...opportunity, opportunities: [{ ...opportunity.opportunities[0], primary_source_candidates: [
    { ...articleCandidate, discovered_from: "https://example.org/other" },
    { ...articleCandidate, url: "https://example.org/wrong" },
  ] }] };
  assert.deepEqual(reconcileRelatedSources(project, poisoned).opportunities[0].primary_source_candidates, []);
});
