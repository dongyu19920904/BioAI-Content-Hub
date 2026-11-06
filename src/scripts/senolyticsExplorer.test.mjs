import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseScores,
  selectScores,
  SCORE_SHA256,
} from "./senolyticsExplorer.mjs";

const raw = readFileSync(
  new URL(
    "../../public/data/senolytics-2023/xgboost_prediction_scores.csv",
    import.meta.url
  )
);
const rows = parseScores(raw.toString("utf8"));

test("retains the exact licensed original CSV bytes and 4340 rows", () => {
  assert.equal(createHash("sha256").update(raw).digest("hex"), SCORE_SHA256);
  assert.equal(
    createHash("md5").update(raw).digest("hex"),
    "07d82555f61fb5e7f7fdbe30dd3eb33d"
  );
  assert.equal(rows.length, 4340);
});
test("research threshold is strictly >0.44 and returns 21, not an efficacy claim", () => {
  assert.equal(selectScores(rows, { selectedOnly: true }).total, 21);
  assert.equal(
    selectScores([{ row: 1, name: "fixture", score: 0.44 }], {
      selectedOnly: true,
    }).total,
    0
  );
});
test("descending and ascending preserve original CSV row identifiers", () => {
  assert.equal(selectScores(rows).items[0].score, 0.9516899);
  assert.equal(selectScores(rows).items[0].row, 1);
  const first = selectScores(rows, { ascending: true }).items[0];
  assert.equal(first.score, 0.0000034736206);
  assert.equal(first.row, 4340);
  assert.equal(rows[0].row, 1); // Sorting does not mutate the source.
});
test("search is case-insensitive literal text, including hostile-looking input", () => {
  const result = selectScores(rows, { query: " gINKGETin " });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].row, 9);
  assert.equal(selectScores(rows, { query: "<script>" }).total, 0);
  assert.equal(selectScores(rows, { query: "[" }).total >= 0, true);
});
test("empty search, pagination, negative and out-of-range pages are bounded", () => {
  assert.equal(selectScores(rows).pages, 174);
  assert.equal(selectScores(rows, { page: 173 }).items.length, 15);
  assert.equal(selectScores(rows, { page: -1 }).page, 0);
  assert.equal(selectScores(rows, { page: 1e6 }).page, 173);
  assert.deepEqual(
    selectScores(rows, { query: "__no_such_compound__", page: 9 }),
    {
      total: 0,
      pages: 1,
      page: 0,
      items: [],
    }
  );
});
test("parses quoted commas, escaped quotes, embedded newlines and BOM", () => {
  const parsed = parseScores(
    '\uFEFFName,probability,z_score\r\n"a,""b""\nc",0.4,2\r\n'
  );
  assert.equal(parsed[0].name, 'a,"b"\nc');
});
test("rejects malformed headers, unclosed quotes, empty and invalid numbers", () => {
  for (const text of [
    "name,probability,z_score\nx,0.4,1",
    'Name,probability,z_score\n"x,0.4,1',
    "Name,probability,z_score\nx,,1",
    "Name,probability,z_score\nx,NaN,1",
    "Name,probability,z_score\nx,1.1,1",
    "Name,probability,z_score\nx,0.4,Infinity",
    "Name,probability,z_score\nx,0.4,1,extra",
  ])
    assert.throws(() => parseScores(text));
  assert.throws(() => parseScores("x".repeat(300_001)));
});
