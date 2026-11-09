const assert = require("node:assert");
const test = require("node:test");
const { COURSE } = require("../course.js");
const { grade } = require("../grader.js");
const P = require("../progress.js");
const SAMPLES = require("./fixtures.js");

function clock() {
  let i = 0;
  return () => new Date(Date.UTC(2026, 10, 9, 10, 0, i++)).toISOString();
}

function attempt(store, id, which) {
  const lab = COURSE.labs.find((l) => l.id === id);
  const input = SAMPLES[id][which];
  return store.recordAttempt(id, input, grade(lab, input));
}

test("progress survives a reload from the same storage", () => {
  const storage = P.memoryStorage();
  const a = P.createStore({ storage, now: clock() });
  assert.strictEqual(a.load(), null);
  assert.ok(a.persistent);
  attempt(a, "say-what-you-want", "weak");
  attempt(a, "say-what-you-want", "strong");
  a.saveDraft("who-its-for", { text: "half written" });
  a.setLearner("Sam");

  const b = P.createStore({ storage, now: clock() });
  assert.strictEqual(b.load(), null);
  const s = b.summary("say-what-you-want");
  assert.strictEqual(s.status, "passed");
  assert.strictEqual(s.attempts, 2);
  assert.strictEqual(b.attempts("say-what-you-want")[0].input.text, SAMPLES["say-what-you-want"].weak.text);
  assert.deepStrictEqual(b.draft("who-its-for"), { text: "half written" });
  assert.strictEqual(b.state.learner, "Sam");
  assert.strictEqual(b.summary("let-it-ask").status, "new");
});

test("submitting an attempt clears that lab's draft", () => {
  const s = P.createStore({ storage: P.memoryStorage(), now: clock() });
  s.load();
  s.saveDraft("fix-the-reply", { text: "draft" });
  attempt(s, "fix-the-reply", "weak");
  assert.strictEqual(s.draft("fix-the-reply"), undefined);
});

test("damaged saved data is backed up and the studio starts fresh", () => {
  const storage = P.memoryStorage();
  storage.setItem("af-studio-v1", "{not json");
  const s = P.createStore({ storage, now: clock() });
  const notice = s.load();
  assert.match(notice, /could not be read/);
  assert.deepStrictEqual(s.state.labs, {});
  const backup = storage._keys().find((k) => k.startsWith("af-studio-v1-damaged-"));
  assert.ok(backup, "backup key written");
  assert.strictEqual(storage.getItem(backup), "{not json");
  assert.doesNotThrow(() => JSON.parse(storage.getItem("af-studio-v1")));
});

test("unknown schema versions are treated as damaged, not trusted", () => {
  const storage = P.memoryStorage();
  storage.setItem("af-studio-v1", JSON.stringify({ version: 99, labs: {} }));
  const s = P.createStore({ storage, now: clock() });
  assert.match(s.load(), /could not be read/);
});

test("malformed attempts inside valid data are dropped", () => {
  const storage = P.memoryStorage();
  storage.setItem("af-studio-v1", JSON.stringify({ version: 1, labs: { "who-its-for": { attempts: [{ at: "x" }, { at: "2026-01-01", score: 140, passed: true }] } } }));
  const s = P.createStore({ storage });
  assert.strictEqual(s.load(), null);
  const list = s.attempts("who-its-for");
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].score, 100, "scores are clamped");
});

test("blocked storage falls back to memory and says so", () => {
  const blocked = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); }, removeItem() {} };
  const s = P.createStore({ storage: blocked, now: clock() });
  assert.strictEqual(s.persistent, false);
  assert.match(s.load(), /blocked saving/);
  assert.doesNotThrow(() => attempt(s, "say-what-you-want", "strong"));
  assert.strictEqual(s.summary("say-what-you-want").status, "passed");
});

test("a full browser store trims old attempts instead of losing the save", () => {
  const inner = P.memoryStorage();
  let limit = Infinity;
  const storage = {
    getItem: inner.getItem,
    removeItem: inner.removeItem,
    setItem(k, v) { if (String(v).length > limit) throw new Error("QuotaExceededError"); inner.setItem(k, v); }
  };
  const s = P.createStore({ storage, now: clock() });
  s.load();
  for (let i = 0; i < 8; i++) attempt(s, "fix-the-reply", "strong");
  limit = inner.getItem("af-studio-v1").length - 10;
  const notice = attempt(s, "fix-the-reply", "weak");
  assert.match(notice, /trimmed/);
  assert.strictEqual(JSON.parse(inner.getItem("af-studio-v1")).labs["fix-the-reply"].attempts.length, 3);
});

test("attempt history is capped", () => {
  const s = P.createStore({ storage: P.memoryStorage(), now: clock() });
  s.load();
  for (let i = 0; i < P.MAX_ATTEMPTS + 5; i++) attempt(s, "who-its-for", "weak");
  assert.strictEqual(s.attempts("who-its-for").length, P.MAX_ATTEMPTS);
});

test("export then import into another browser merges without duplicates", () => {
  const a = P.createStore({ storage: P.memoryStorage(), now: clock() });
  a.load();
  a.setLearner("Robin");
  attempt(a, "say-what-you-want", "strong");
  attempt(a, "check-the-facts", "weak");
  const file = a.exportJSON();

  const t2 = (() => { let i = 0; return () => new Date(Date.UTC(2026, 10, 10, 9, 0, i++)).toISOString(); })();
  const b = P.createStore({ storage: P.memoryStorage(), now: t2 });
  b.load();
  attempt(b, "check-the-facts", "strong");
  const first = b.importJSON(file);
  assert.strictEqual(first.added, 2);
  assert.strictEqual(b.attempts("check-the-facts").length, 2);
  assert.strictEqual(b.state.learner, "Robin");
  assert.strictEqual(b.importJSON(file).added, 0, "importing twice adds nothing");
});

test("import rejects files that are not Studio progress", () => {
  const s = P.createStore({ storage: P.memoryStorage() });
  s.load();
  assert.throws(() => s.importJSON("hello"), /not valid JSON/);
  assert.throws(() => s.importJSON(JSON.stringify({ version: 4 })), /unknown version/);
});

test("class codes round-trip scores but never carry typed text", () => {
  const s = P.createStore({ storage: P.memoryStorage(), now: clock() });
  s.load();
  s.setLearner("Jo");
  attempt(s, "keep-it-private", "weak");
  attempt(s, "who-its-for", "strong");
  const code = s.classCode();
  assert.match(code, /^AF1\./);
  const raw = Buffer.from(code.slice(4).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  assert.doesNotMatch(raw, /Dana|dentist|uncle/i, "no learner text inside the code");
  const back = P.decodeClassCode(code);
  assert.strictEqual(back.name, "Jo");
  assert.strictEqual(back.labs["who-its-for"].passed, true);
  assert.deepStrictEqual(back.labs["keep-it-private"].missed, ["names"]);
});

test("decodeClassCode explains bad input", () => {
  assert.throws(() => P.decodeClassCode("hello"), /start with AF1/);
  assert.throws(() => P.decodeClassCode("AF1.%%%%"), /damaged/);
});
