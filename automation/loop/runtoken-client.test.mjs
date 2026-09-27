import assert from "node:assert/strict";
import test from "node:test";
import { callRunToken, messagesUrl } from "./runtoken-client.mjs";

const env = {
  RUNTOKEN_API_KEY: "test-only-not-real",
  ANTHROPIC_API_URL: "https://www.runtoken.ai",
  DEFAULT_ANTHROPIC_MODEL: "claude-sonnet-5",
  DEFAULT_ANTHROPIC_BACKUP_MODEL: "claude-opus-4-8",
};

test("RunToken root and /v1 resolve to the Anthropic Messages route", () => {
  assert.equal(messagesUrl(), "https://www.runtoken.ai/v1/messages");
  assert.equal(messagesUrl("https://www.runtoken.ai/v1"), "https://www.runtoken.ai/v1/messages");
  assert.throws(() => messagesUrl("https://example.com"), /RunToken HTTPS/);
  assert.throws(() => messagesUrl("https://www.runtoken.ai@evil.example"), /RunToken HTTPS/);
});

test("successful request uses the primary model and keeps the key in x-api-key only", async () => {
  let calls = 0;
  const output = await callRunToken("reply ok", {
    env,
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, "https://www.runtoken.ai/v1/messages");
      assert.equal(options.redirect, "error");
      assert.equal(options.headers["x-api-key"], env.RUNTOKEN_API_KEY);
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(JSON.parse(options.body).model, "claude-sonnet-5");
      return { ok: true, json: async () => ({ content: [{ type: "text", text: "ok" }] }) };
    },
  });
  assert.equal(output, "ok");
  assert.equal(calls, 1);
});

test("model-not-found tries the listed backup model once", async () => {
  const models = [];
  const output = await callRunToken("reply ok", {
    env,
    fetchImpl: async (_url, options) => {
      const model = JSON.parse(options.body).model;
      models.push(model);
      return model === "claude-sonnet-5"
        ? { ok: false, status: 404 }
        : { ok: true, json: async () => ({ content: [{ type: "text", text: "backup ok" }] }) };
    },
  });
  assert.equal(output, "backup ok");
  assert.deepEqual(models, ["claude-sonnet-5", "claude-opus-4-8"]);
});

test("missing key and auth errors never expose provider response or retry", async () => {
  await assert.rejects(callRunToken("x", { env: { ...env, RUNTOKEN_API_KEY: "" } }), /缺少 RUNTOKEN_API_KEY/);
  let calls = 0;
  await assert.rejects(
    callRunToken("x", {
      env,
      fetchImpl: async () => { calls++; return { ok: false, status: 401, text: async () => "secret echoed by proxy" }; },
    }),
    error => error.message.includes("401") && !error.message.includes("secret echoed"),
  );
  assert.equal(calls, 1);
});
