const assert = require("node:assert");
const test = require("node:test");
const { COURSE, EVALUATION_LIMITS } = require("../course.js");
const { grade, compareResults, hasTerm, changeRatio, normalize } = require("../grader.js");
const SAMPLES = require("./fixtures.js");

const { findLab } = require("../catalog.js");
const lab = (id) => findLab(id);

test("course data is well formed", () => {
  const ids = new Set();
  const known = new Set(["anyOf", "allOf", "absent", "minWords", "maxWords", "pattern", "differsFrom", "choice", "flags"]);
  for (const l of COURSE.labs) {
    assert.ok(!ids.has(l.id), "duplicate lab id " + l.id);
    ids.add(l.id);
    assert.ok(l.learn && l.learn.idea && l.learn.compare.length >= 2, l.id + " needs a lesson with a comparison");
    assert.ok(l.attempt && l.attempt.instruction, l.id + " needs an attempt");
    assert.ok(l.facilitator && l.facilitator.discuss.length, l.id + " needs facilitator notes");
    const checkIds = new Set();
    for (const c of l.checks) {
      assert.ok(known.has(c.type), l.id + ": unknown check type " + c.type);
      assert.ok(c.tip && c.note && c.label, l.id + "/" + c.id + " needs label, tip, and note");
      assert.ok(!checkIds.has(c.id), l.id + ": duplicate check id " + c.id);
      checkIds.add(c.id);
    }
  }
  assert.strictEqual(COURSE.labs.length, 6);
  assert.ok(EVALUATION_LIMITS.length >= 3);
});

test("course copy follows house style: no em or en dashes, no exclamation points", () => {
  const text = JSON.stringify(COURSE) + JSON.stringify(EVALUATION_LIMITS);
  assert.doesNotMatch(text, /[–—]/);
  assert.doesNotMatch(text, /!/);
});

test("term matching respects word boundaries and stems", () => {
  assert.ok(hasTerm("please be polite", "polite*"));
  assert.ok(hasTerm("say it politely", "polite*"));
  assert.ok(!hasTerm("the tapestry", "tap"));
  assert.ok(hasTerm("the tap drips", "tap"));
  assert.ok(hasTerm("fix it by friday.", "friday"));
  assert.strictEqual(normalize("  It’s  OK "), "it's ok");
});

test("changeRatio is 0 for the same words and grows with real rewrites", () => {
  assert.strictEqual(changeRatio("Write an email to my landlord.", "write an EMAIL to my landlord"), 0);
  assert.ok(changeRatio("Write an email to my landlord please", "Write an email to my landlord.") < 0.4);
  assert.ok(changeRatio(SAMPLES["say-what-you-want"].strong.text, "Write an email to my landlord.") > 0.4);
});

for (const [id, s] of Object.entries(SAMPLES)) {
  test(`${id}: a revised attempt passes and a first attempt does not`, () => {
    const strong = grade(lab(id), s.strong);
    const weak = grade(lab(id), s.weak);
    assert.ok(strong.passed, `${id} strong should pass, got ${strong.score}: ${strong.summary}`);
    assert.ok(!weak.passed, `${id} weak should fail, got ${weak.score}`);
    assert.ok(strong.score > weak.score);
    assert.ok(weak.checks.some((c) => !c.met && c.message), "a failed attempt names what to fix");
  });
}

test("the unedited starter text never passes", () => {
  for (const l of COURSE.labs) {
    if (!l.attempt.starter) continue;
    const r = grade(l, { text: l.attempt.starter });
    assert.ok(!r.passed, l.id + " starter should not pass");
  }
});

test("empty attempts get a clear prompt, not a score", () => {
  const r = grade(lab("who-its-for"), { text: "   " });
  assert.ok(r.empty);
  assert.strictEqual(r.passed, false);
  assert.match(r.summary, /type your attempt/i);
  assert.ok(grade(lab("let-it-ask"), { why: "x" }).empty);
});

test("grading is deterministic", () => {
  const l = lab("fix-the-reply");
  const a = grade(l, SAMPLES["fix-the-reply"].strong);
  for (let i = 0; i < 5; i++) assert.deepStrictEqual(grade(l, SAMPLES["fix-the-reply"].strong), a);
});

test("flag lab: misses and false alarms are reported and scored", () => {
  const l = lab("check-the-facts");
  const perfect = grade(l, { flags: ["s3", "s5", "s7"] });
  assert.strictEqual(perfect.score, 100);
  const partial = grade(l, { flags: ["s3", "s7", "s2"] });
  assert.deepStrictEqual(partial.checks[0].detail, { hits: ["s3", "s7"], missed: ["s5"], falseAlarms: ["s2"] });
  assert.strictEqual(partial.score, 50);
  assert.strictEqual(grade(l, { flags: [] }).score, 0);
  assert.strictEqual(grade(l, { flags: ["s1", "s2", "s4", "s6"] }).score, 0, "never below zero");
});

test("privacy lab: catches leftover details and a deleted request", () => {
  const l = lab("keep-it-private");
  const starter = grade(l, { text: l.attempt.starter });
  const missed = starter.checks.filter((c) => !c.met).map((c) => c.id);
  assert.deepStrictEqual(missed, ["names", "email", "phone", "id", "address"]);
  const gutted = grade(l, { text: "Write a note." });
  assert.ok(!gutted.passed);
  assert.ok(gutted.checks.find((c) => c.id === "keeps-ask").met === false);
});

test("choice lab: explanation is graded from the why field only", () => {
  const l = lab("let-it-ask");
  const r = grade(l, { choice: "C", why: "" });
  assert.strictEqual(r.checks.find((c) => c.id === "pick").met, true);
  assert.strictEqual(r.checks.find((c) => c.id === "why-ask").met, false);
  assert.strictEqual(r.score, 50);
});

test("compareResults names what improved and what slipped", () => {
  const l = lab("say-what-you-want");
  const before = grade(l, { text: "Write a polite email to my landlord about the dripping faucet." });
  const after = grade(l, SAMPLES["say-what-you-want"].strong);
  const diff = compareResults(before, after);
  assert.ok(diff.scoreDelta > 0);
  assert.ok(diff.gained.includes("Gives a deadline"));
  assert.deepStrictEqual(diff.lost, []);
  assert.strictEqual(compareResults(null, after), null);
});

test("unknown check types fail loudly", () => {
  assert.throws(() => grade({ id: "x", type: "prompt", checks: [{ id: "a", type: "vibes" }] }, { text: "hi" }), /Unknown check type/);
});
