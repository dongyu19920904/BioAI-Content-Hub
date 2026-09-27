import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildEvidencePack } from "./evidence-pack.mjs";
import { reconcileRelatedSources } from "./reconcile-related-sources.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? "" : process.argv[index + 1] || "";
}

function assertInsideRoot(target) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Output must stay inside this repository");
}

const inputFile = option("input");
if (!inputFile) throw new Error("Usage: node automation/loop/build-evidence-packs.mjs --input path/to/opportunity.json [--related-input other-section.json] [--output-dir automation/runs]");
let document = JSON.parse(await readFile(path.resolve(inputFile), "utf8"));
if (document.schema_version !== 1 || !Array.isArray(document.opportunities) || !/^\d{4}-\d{2}-\d{2}$/.test(document.report_date || "")) {
  throw new Error("Unsupported opportunity document");
}
const relatedInput = option("related-input");
if (relatedInput) {
  document = reconcileRelatedSources(document, JSON.parse(await readFile(path.resolve(relatedInput), "utf8")));
}
const sourcePage = new URL(document.source_page, "https://news.aibioo.cn").toString();
if (!/^https:\/\/news\.aibioo\.cn\//.test(sourcePage)) throw new Error("Unexpected source page");
const outputDir = path.resolve(root, option("output-dir") || "automation/runs", document.report_date);
assertInsideRoot(outputDir);
const packs = document.opportunities.map((record) => buildEvidencePack(record, sourcePage));
const recordById = new Map(document.opportunities.map((record) => [record.opportunity_id, record]));
await mkdir(outputDir, { recursive: true });
for (const pack of packs) {
  const record = recordById.get(pack.opportunity_id);
  const directory = path.join(outputDir, pack.opportunity_id);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(path.join(directory, "website.md"), pack.files.website, "utf8"),
    writeFile(path.join(directory, "wechat.md"), pack.files.wechat, "utf8"),
    writeFile(path.join(directory, "bilibili.md"), pack.files.bilibili, "utf8"),
    writeFile(path.join(directory, "storyboard.json"), `${JSON.stringify(pack.files.storyboard, null, 2)}\n`, "utf8"),
    writeFile(path.join(directory, "manifest.json"), `${JSON.stringify({ opportunity_id: pack.opportunity_id, related_opportunity_ids: record.related_opportunity_ids || [], shared_primary_source_candidates: (record.primary_source_candidates || []).filter((item) => item.shared_candidate_from).map((item) => ({ doi: item.doi, shared_candidate_from: item.shared_candidate_from, relationship_verified: false })), gate: pack.gate, source_page: sourcePage, attribution_urls: pack.attribution_urls, feedback_url: pack.feedback_url, channel_status: { website: "not_published", wechat: "not_published", bilibili: "not_published" } }, null, 2)}\n`, "utf8"),
  ]);
}
process.stdout.write(`${JSON.stringify({ report_date: document.report_date, pack_count: packs.length, publishable_count: packs.filter((item) => item.gate.status === "ready_for_channel_authorization").length, output_dir: outputDir })}\n`);
