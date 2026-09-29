import assert from "node:assert/strict";
import test from "node:test";
import { runDiscovery } from "./discover-open-source.mjs";

const healthy = {
  full_name: "ResearchLab/AgingClock",
  description: "Reproducible aging clock research software",
  license: { spdx_id: "MIT" },
  pushed_at: "2026-09-20T12:00:00Z",
  stargazers_count: 21,
  archived: false,
  fork: false,
  private: false,
};

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test("searches metadata, checks README, and opens one bounded issue without executing code", async () => {
  const calls = [];
  let body;
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/search/repositories?")) return response(200, {
      incomplete_results: false,
      items: [
        { ...healthy, full_name: "gangcai/scageclock" },
        { ...healthy, full_name: "random/TwoHandedClock", description: "Operating system page aging clock", license: null },
        healthy,
        { ...healthy, full_name: "Unknown/Unlicensed", license: null },
      ],
    });
    if (url.endsWith("/repos/ResearchLab/AgingClock/readme")) return response(200, { name: "README.md" });
    if (url.includes("/issues?")) return response(200, []);
    if (url.endsWith("/issues") && options.method === "POST") {
      body = JSON.parse(options.body).body;
      return response(201, { html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/issues/50" });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const result = await runDiscovery(fetcher, "test-token", new Date("2026-09-29T00:00:00Z"));
  assert.equal(result.status, "created");
  assert.equal(result.candidates, 1);
  assert.match(body, /ResearchLab\/AgingClock/);
  assert.doesNotMatch(body, /Unlicensed|scageclock|TwoHandedClock/);
  assert.match(body, /不代表有真实需求、科学效力/);
  assert.equal(calls.filter((call) => call.url.includes("/search/repositories?")).length, 4);
  assert.equal(calls.filter((call) => call.options.method === "POST").length, 1);
  assert.ok(calls.every((call) => call.url.startsWith("https://api.github.com/")));
});

test("keeps existing issue unchanged when the candidate list is the same", async () => {
  let savedBody;
  let writes = 0;
  const fetcher = async (url, options) => {
    if (url.includes("/search/repositories?")) return response(200, { incomplete_results: false, items: [healthy] });
    if (url.endsWith("/repos/ResearchLab/AgingClock/readme")) return response(200, {});
    if (url.includes("/issues?")) return response(200, savedBody ? [{
      number: 50,
      title: "[项目候选] AI 延寿研究开源工具待核清单",
      body: savedBody,
      html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/issues/50",
    }] : []);
    if (url.endsWith("/issues") && options.method === "POST") {
      writes += 1;
      savedBody = JSON.parse(options.body).body;
      return response(201, { html_url: "https://github.com/dongyu19920904/BioAI-Content-Hub/issues/50" });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const date = new Date("2026-09-29T00:00:00Z");
  assert.equal((await runDiscovery(fetcher, "", date)).status, "created");
  assert.equal((await runDiscovery(fetcher, "", date)).status, "unchanged");
  assert.equal(writes, 1);
});

test("does not overwrite the queue when all searches fail", async () => {
  let issueTouched = false;
  const fetcher = async (url) => {
    if (url.includes("/issues")) issueTouched = true;
    return response(503, {});
  };
  await assert.rejects(runDiscovery(fetcher), /All project searches failed/);
  assert.equal(issueTouched, false);
});
