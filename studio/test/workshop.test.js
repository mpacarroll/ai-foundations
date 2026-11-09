const assert = require("node:assert");
const test = require("node:test");
const { COURSE } = require("../course.js");
const { DEMO_CLASS } = require("../demo-class.js");
const { encodeClassCode, decodeClassCode } = require("../progress.js");
const W = require("../workshop.js");

test("agenda covers every lab plus intro and wrap-up", () => {
  const a = W.buildAgenda(COURSE);
  assert.strictEqual(a.items.length, COURSE.labs.length + 2);
  assert.strictEqual(a.totalMinutes, 5 + 5 + COURSE.labs.reduce((t, l) => t + l.facilitator.minutes, 0));
  assert.strictEqual(a.items[1].at, 5);
  assert.strictEqual(W.formatClock(75), "1:15");
});

test("demo class codes decode and aggregate into a class board", () => {
  const text = DEMO_CLASS.map(encodeClassCode).join("\n") + "\nnot-a-code";
  const { learners, errors } = W.parseCodes(text, decodeClassCode);
  assert.strictEqual(learners.length, 5);
  assert.strictEqual(errors.length, 1);
  assert.strictEqual(errors[0].index, 6);

  const board = W.aggregateClass(COURSE, learners);
  assert.strictEqual(board.learnerCount, 5);
  const first = board.labs.find((l) => l.labId === "say-what-you-want");
  assert.strictEqual(first.tried, 5);
  assert.strictEqual(first.passed, 4);
  assert.strictEqual(first.averageBest, Math.round((100 + 88 + 75 + 100 + 63) / 5));
  assert.deepStrictEqual(first.topMiss, { checkId: "tone", label: "Sets the tone", count: 3 });
  const avery = board.rows.find((r) => r.name.startsWith("Avery"));
  assert.strictEqual(avery.passedCount, 6);
  const emerson = board.rows.find((r) => r.name.startsWith("Emerson"));
  assert.strictEqual(emerson.cells.filter(Boolean).length, 1);
  assert.ok(board.focus && board.focus.stuck >= 1);
});

test("an empty class gives an empty board, not an error", () => {
  const board = W.aggregateClass(COURSE, []);
  assert.strictEqual(board.learnerCount, 0);
  assert.strictEqual(board.focus, null);
  assert.ok(board.labs.every((l) => l.averageBest === null));
});
