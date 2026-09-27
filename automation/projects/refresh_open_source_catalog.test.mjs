import assert from "node:assert/strict";
import test from "node:test";
import { refreshCatalog } from "./refresh_open_source_catalog.mjs";

const catalog = {
  observed_at: "2026-09-27T00:00:00Z",
  projects: [{
    repo: "example/research-tool",
    name: "Research Tool",
    github: { url: "https://github.com/example/research-tool", license: "MIT", archived: false, pushed_at: "2026-09-01T00:00:00Z" },
  }],
};

test("refreshes only trusted GitHub metadata", async () => {
  const result = await refreshCatalog(catalog, async () => ({
    full_name: "example/research-tool",
    html_url: "https://github.com/example/research-tool",
    license: { spdx_id: "MIT" },
    archived: true,
    pushed_at: "2026-09-26T00:00:00Z",
  }), new Date("2026-09-27T14:00:00Z"));
  assert.equal(result.observed_at, "2026-09-27T14:00:00.000Z");
  assert.equal(result.projects[0].github.archived, true);
  assert.equal(result.projects[0].github.pushed_at, "2026-09-26T00:00:00Z");
  assert.equal(catalog.projects[0].github.archived, false);
});

test("stops instead of silently changing license", async () => {
  await assert.rejects(
    refreshCatalog(catalog, async () => ({
      full_name: "example/research-tool",
      html_url: "https://github.com/example/research-tool",
      license: { spdx_id: "AGPL-3.0" },
      archived: false,
      pushed_at: "2026-09-26T00:00:00Z",
    })),
    /review before publishing/,
  );
});

test("rejects non-repository API paths", async () => {
  await assert.rejects(
    refreshCatalog({ ...catalog, projects: [{ ...catalog.projects[0], repo: "../secrets" }] }, async () => ({})),
    /Invalid repository/,
  );
});
