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

test("accepts a real project pilot without mislabelling it as a daily opportunity", () => {
  const html = compositionFromStoryboard({ opportunity_id: "project_0123456789abcdef", scenes: [{ seconds: 4, text: "公开样本试跑" }] });
  assert.match(html, /project_0123456789abcdef/);
});

test("hides an old scene when the next timed scene begins", () => {
  const html = compositionFromStoryboard({ opportunity_id: "project_0123456789abcdef", scenes: [{ seconds: 4, text: "第一页" }, { seconds: 4, text: "第二页" }] });
  assert.match(html, /\.scene\{opacity:0;visibility:hidden\}/);
  assert.match(html, /tl\.set\("#scene-1",\{autoAlpha:0\},4\)/);
  assert.match(html, /tl\.set\("#scene-2",\{autoAlpha:1,y:28\},4\)/);
});
