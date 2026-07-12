// TDD RED first — the pure prompt-building logic, tested in Node before any UI.
const assert = require("node:assert");
const test = require("node:test");
const { buildPrompt } = require("./prompt_helper.js");

test("assembles role, task, and context into a structured prompt", () => {
  const out = buildPrompt({
    role: "a patient teacher",
    task: "explain how a rainbow forms",
    audience: "my 8-year-old",
    format: "short paragraphs",
  });
  assert.match(out, /You are a patient teacher\./);
  assert.match(out, /explain how a rainbow forms/);
  assert.match(out, /my 8-year-old/);
  assert.match(out, /short paragraphs/);
});

test("omits empty optional fields cleanly (no blank labels)", () => {
  const out = buildPrompt({ task: "write a thank-you note" });
  assert.match(out, /write a thank-you note/);
  assert.doesNotMatch(out, /You are \./); // no empty role line
  assert.doesNotMatch(out, /Audience:/); // no empty audience label
  assert.doesNotMatch(out, /undefined/);
});

test("requires a task and says so", () => {
  assert.throws(() => buildPrompt({ role: "a chef" }), /task/i);
});

test("adds the beginner-friendly 'ask me questions' closer by default", () => {
  const out = buildPrompt({ task: "plan a birthday party" });
  assert.match(out, /ask me any questions/i);
});

test("closer can be turned off", () => {
  const out = buildPrompt({ task: "plan a party", askFirst: false });
  assert.doesNotMatch(out, /ask me any questions/i);
});
