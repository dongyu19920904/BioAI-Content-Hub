import assert from "node:assert/strict";
import test from "node:test";
import { checkPublicRepo, parseRepoUrl } from "./repoQuickCheck.mjs";

test("accepts only public GitHub repository home URLs", () => {
  assert.equal(
    parseRepoUrl("https://github.com/lucascamillomd/pyaging")?.slug,
    "lucascamillomd/pyaging"
  );
  for (const url of [
    "https://github.com/owner/repo/tree/main",
    "https://github.com/owner/repo?token=abc",
    "https://evil.example/owner/repo",
    "https://name:secret@github.com/owner/repo",
    "http://github.com/owner/repo",
  ])
    assert.equal(parseRepoUrl(url), null);
});

test("checks only GitHub metadata and README, never repository code", async () => {
  const urls = [];
  const fetcher = async url => {
    urls.push(url);
    if (url.endsWith("/readme")) return { status: 200 };
    return {
      status: 200,
      ok: true,
      json: async () => ({
        full_name: "owner/repo",
        private: false,
        archived: false,
        license: { spdx_id: "MIT" },
        pushed_at: "2026-09-28T00:00:00Z",
        size: 123,
      }),
    };
  };
  const result = await checkPublicRepo(
    "https://github.com/owner/repo",
    fetcher
  );
  assert.equal(result.license, "MIT");
  assert.equal(result.readme, "GitHub API 可读取");
  assert.equal(urls.length, 2);
  assert.deepEqual(urls, [
    "https://api.github.com/repos/owner/repo",
    "https://api.github.com/repos/owner/repo/readme",
  ]);
});

test("fails closed on private or mismatched repository", async () => {
  const fetcher = async () => ({
    status: 200,
    ok: true,
    json: async () => ({ full_name: "other/repo", private: false }),
  });
  await assert.rejects(
    checkPublicRepo("https://github.com/owner/repo", fetcher),
    /身份/
  );
});

test("shows cautious warnings for missing license and README", async () => {
  const fetcher = async url =>
    url.endsWith("/readme")
      ? { status: 404 }
      : {
          status: 200,
          ok: true,
          json: async () => ({
            full_name: "owner/repo",
            private: false,
            archived: true,
            license: null,
            pushed_at: "bad",
            size: 1_000_001,
          }),
        };
  const result = await checkPublicRepo(
    "https://github.com/owner/repo",
    fetcher
  );
  assert.equal(result.warnings.length, 4);
  assert.equal(result.pushed, "未知");
});
