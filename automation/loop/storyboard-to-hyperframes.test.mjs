import test from "node:test";
import assert from "node:assert/strict";
import { compositionFromStoryboard } from "./storyboard-to-hyperframes.mjs";

test("makes bounded timed video HTML without interpreting story text as markup", () => {
  const html = compositionFromStoryboard({ opportunity_id: "opp_0123456789abcdef", scenes: [{ seconds: 20, text: "研究 <script>alert(1)</script>" }, { seconds: 30, text: "局限" }] }, 6);
  assert.match(html, /data-duration="6"/);
  assert.match(html, /研究 &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /scene-2/);
});
