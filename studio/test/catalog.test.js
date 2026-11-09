const assert = require("node:assert");
const test = require("node:test");
const { COURSES, courseById, courseOfLab, findLab, allLabIds } = require("../catalog.js");
const { FAILURE_CAUSES } = require("../course-failures.js");
const { grade, compareResults } = require("../grader.js");
const P = require("../progress.js");
const W = require("../workshop.js");
const { DEMO_CLASS } = require("../demo-class.js");
const SAMPLES = require("./fixtures.js");

const KNOWN = new Set(["anyOf", "allOf", "absent", "minWords", "maxWords", "pattern", "differsFrom", "choice", "flags", "diagnosis"]);

test("catalog lists both courses and lab ids are unique across them", () => {
  assert.deepStrictEqual(COURSES.map((c) => c.id), ["first-prompts", "when-ai-gets-it-wrong"]);
  const ids = allLabIds();
  assert.strictEqual(new Set(ids).size, ids.length, "lab ids must be unique across courses");
  assert.strictEqual(ids.length, 11);
  assert.strictEqual(courseOfLab("name-the-failure").id, "when-ai-gets-it-wrong");
  assert.strictEqual(courseOfLab("say-what-you-want").id, "first-prompts");
  assert.strictEqual(courseOfLab("nope"), null);
  assert.strictEqual(courseById("nope"), null);
  assert.strictEqual(findLab("push-back-well").type, "choice");
});

test("every course is well formed and every lab has fixtures", () => {
  for (const c of COURSES) {
    assert.ok(c.title && c.summary && c.labs.length >= 5, c.id);
    for (const l of c.labs) {
      assert.ok(l.learn && l.learn.idea && l.learn.compare.length >= 2, l.id + " needs a lesson with a comparison");
      assert.ok(l.attempt && l.attempt.instruction && l.attempt.scenario, l.id + " needs an attempt");
      assert.ok(l.facilitator && l.facilitator.discuss.length && l.facilitator.minutes, l.id + " needs facilitator notes");
      assert.ok(SAMPLES[l.id], l.id + " needs a strong and weak sample in fixtures.js");
      for (const ch of l.checks) {
        assert.ok(KNOWN.has(ch.type), l.id + ": unknown check type " + ch.type);
        assert.ok(ch.tip && ch.note && ch.label, l.id + "/" + ch.id + " needs label, tip, and note");
      }
    }
  }
});

test("new course copy follows house style", () => {
  const text = JSON.stringify(COURSES[1]);
  assert.doesNotMatch(text, /[–—]/);
  assert.doesNotMatch(text, /!/);
});

test("diagnose cases use only known causes and every cause is used", () => {
  const lab = findLab("name-the-failure");
  const causeIds = new Set(FAILURE_CAUSES.map((k) => k.id));
  for (const c of lab.attempt.cases) {
    assert.ok(causeIds.has(c.cause), c.id + " has unknown cause " + c.cause);
    assert.ok(c.explain && c.prompt && c.reply);
  }
  assert.deepStrictEqual(new Set(lab.attempt.cases.map((c) => c.cause)), causeIds);
});

test("diagnose grading: right, wrong, and skipped cases are reported, skipping is never rewarded", () => {
  const lab = findLab("name-the-failure");
  const perfect = grade(lab, SAMPLES["name-the-failure"].strong);
  assert.strictEqual(perfect.score, 100);
  assert.ok(perfect.checks[0].met);
  const four = grade(lab, { picks: { c1: "ignored", c2: "invented", c3: "vague", c4: "outdated" } });
  assert.strictEqual(four.score, 67);
  assert.ok(four.passed, "four of six is the pass mark");
  assert.deepStrictEqual(four.checks[0].detail.unanswered, ["c5", "c6"]);
  const wrong = grade(lab, { picks: { c1: "invented" } });
  assert.deepStrictEqual(wrong.checks[0].detail.wrong, [{ id: "c1", picked: "invented", expected: "ignored" }]);
  assert.strictEqual(wrong.score, 0);
  assert.ok(grade(lab, { picks: {} }).empty);
  assert.ok(grade(lab, { picks: { c1: "" } }).empty);
  assert.match(grade(lab, null).summary, /Pick a cause/);
});

test("summary check lab shows its source and scores changes and additions", () => {
  const lab = findLab("check-the-summary");
  assert.ok(lab.attempt.source.includes("front desk"));
  assert.strictEqual(grade(lab, { flags: ["s2", "s5", "s7"] }).score, 100);
  assert.strictEqual(grade(lab, { flags: ["s2", "s5"] }).score, 67);
  assert.strictEqual(grade(lab, { flags: ["s5", "s1"] }).score, 17);
});

for (const c of COURSES.slice(1)) {
  for (const l of c.labs) {
    test(`${l.id}: a revised attempt passes, a first attempt does not, and the retry names what improved`, () => {
      const strong = grade(l, SAMPLES[l.id].strong);
      const weak = grade(l, SAMPLES[l.id].weak);
      assert.ok(strong.passed, `${l.id} strong should pass, got ${strong.score}: ${strong.summary}`);
      assert.ok(!weak.passed, `${l.id} weak should fail, got ${weak.score}`);
      const diff = compareResults(weak, strong);
      assert.ok(diff.scoreDelta > 0);
      assert.ok(weak.checks.some((ch) => !ch.met && ch.message));
    });
  }
}

test("starter text in the new course never passes", () => {
  for (const l of COURSES[1].labs) {
    if (!l.attempt.starter) continue;
    assert.ok(!grade(l, { text: l.attempt.starter }).passed, l.id);
  }
});

test("diagnose picks survive save, reload, and file import", () => {
  const storage = P.memoryStorage();
  const a = P.createStore({ storage, now: () => "2026-11-09T06:00:00.000Z" });
  a.load();
  const lab = findLab("name-the-failure");
  const input = SAMPLES["name-the-failure"].strong;
  a.recordAttempt(lab.id, input, grade(lab, input));
  a.setCourse("when-ai-gets-it-wrong");
  const b = P.createStore({ storage });
  b.load();
  assert.deepStrictEqual(b.attempts(lab.id)[0].input, input);
  assert.strictEqual(b.state.course, "when-ai-gets-it-wrong");
  const c = P.createStore({ storage: P.memoryStorage() });
  c.load();
  assert.strictEqual(c.importJSON(a.exportJSON()).added, 1);
  assert.deepStrictEqual(c.attempts(lab.id)[0].input.picks, input.picks);
});

test("saves from before the second course still load", () => {
  const storage = P.memoryStorage();
  storage.setItem("af-studio-v1", JSON.stringify({ version: 1, learner: "", labs: {}, drafts: {}, workshop: false }));
  const s = P.createStore({ storage });
  assert.strictEqual(s.load(), null);
  assert.strictEqual(s.state.course, "");
});

test("one progress code covers both courses, and each course gets its own board", () => {
  const learners = W.parseCodes(DEMO_CLASS.map(P.encodeClassCode).join("\n"), P.decodeClassCode).learners;
  const second = W.aggregateClass(COURSES[1], learners);
  const naming = second.labs.find((l) => l.labId === "name-the-failure");
  assert.strictEqual(naming.tried, 3);
  assert.strictEqual(naming.passed, 2);
  assert.strictEqual(second.rows.find((r) => r.name.startsWith("Emerson")).cells.filter(Boolean).length, 0);
  assert.ok(second.focus);
  const agenda = W.buildAgenda(COURSES[1]);
  assert.strictEqual(agenda.items.length, COURSES[1].labs.length + 2);
});
