import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

/** Static timed composition for the open-source HyperFrames CLI. */
export function compositionFromStoryboard(storyboard, maxSeconds = 90) {
  if (!/^opp_[a-f0-9]{16}$/.test(storyboard?.opportunity_id || "") || !Array.isArray(storyboard.scenes) || !storyboard.scenes.length) {
    throw new Error("Invalid storyboard");
  }
  if (!Number.isFinite(maxSeconds) || maxSeconds < 1 || maxSeconds > 90) throw new Error("Invalid duration limit");
  let start = 0;
  const scenes = [];
  for (const scene of storyboard.scenes) {
    const duration = Math.min(Number(scene.seconds), maxSeconds - start);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 90) continue;
    const text = escapeHtml(String(scene.text || "").replace(/\s+/g, " ").slice(0, 160));
    scenes.push(`<section id="scene-${scenes.length + 1}" class="clip scene" data-start="${start}" data-duration="${duration}" data-record-id="${escapeHtml(storyboard.opportunity_id)}">${text}</section>`);
    start += duration;
    if (start >= maxSeconds) break;
  }
  if (!scenes.length) throw new Error("Storyboard contains no usable scenes");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=1280, height=720"><title>AI 生命延续学视频预览</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;background:#071a24;color:#fff;font-family:sans-serif}#root{position:relative;width:1280px;height:720px;overflow:hidden;background:radial-gradient(circle at 80% 20%,#1b5661,#071a24 55%)}.clip{position:absolute;inset:0;display:flex;align-items:center;padding:90px;font-size:64px;line-height:1.22}.scene::before{content:"AI 生命延续学 · 证据优先";position:absolute;top:95px;color:#79e0ce;font-size:30px;letter-spacing:.08em}.scene::after{content:attr(data-record-id) " · 自动生成预览，非医学建议";position:absolute;bottom:54px;font-size:22px;color:#bad1d4}.scene:nth-of-type(even){background:linear-gradient(135deg,#103b47,#071a24)}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-width="1280" data-height="720" data-fps="24" data-duration="${start}">
${scenes.join("\n")}
</div><script>window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});${scenes.map((_, index) => `tl.from("#scene-${index + 1}",{y:28,opacity:0,duration:.45,ease:"power2.out"},${scenes.slice(0, index).reduce((sum, part) => sum + Number(part.match(/data-duration="([^"]+)/)?.[1] || 0), 0) + 0.15});`).join("")}window.__timelines.main=tl;</script></body></html>\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = process.argv[2];
  const seconds = Number(process.argv[3] || 90);
  if (!input) throw new Error("Usage: node storyboard-to-hyperframes.mjs storyboard.json [max-seconds]");
  const storyboard = JSON.parse(await readFile(path.resolve(input), "utf8"));
  const output = path.join(path.dirname(path.resolve(input)), "index.html");
  await writeFile(output, compositionFromStoryboard(storyboard, seconds), "utf8");
  process.stdout.write(`${output}\n`);
}
