// Guard: the buildPrompt inlined in index.html must behave like the tested module.
const assert = require("node:assert");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { buildPrompt } = require("./prompt_helper.js");

function inlineBuildPrompt() {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const m = html.match(/function buildPrompt\(fields\)\s*\{[\s\S]*?\n\}/);
  assert.ok(m, "could not find inline buildPrompt in index.html");
  const sandbox = {};
  vm.runInNewContext(m[0] + "\nthis.buildPrompt = buildPrompt;", sandbox);
  return sandbox.buildPrompt;
}

test("inline HTML buildPrompt matches the module on varied inputs", () => {
  const inline = inlineBuildPrompt();
  const cases = [
    { task: "explain rainbows", role: "a teacher", audience: "a kid", format: "bullets" },
    { task: "write a note" },
    { task: "plan a party", askFirst: false },
  ];
  for (const c of cases) {
    assert.strictEqual(inline(c), buildPrompt(c), `mismatch for ${JSON.stringify(c)}`);
  }
});

test("inline HTML buildPrompt enforces the required task too", () => {
  assert.throws(() => inlineBuildPrompt()({ role: "a chef" }), /task/i);
});
