// AI Foundations Studio: deterministic, rule-based feedback.
// No model calls, no randomness, no network. The same input always gets the same result.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  function normalize(text) {
    return String(text == null ? "" : text)
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // A term matches as a whole word or phrase. A trailing * matches any word ending: "polite*" matches "politely".
  function termRegex(term) {
    const t = normalize(term);
    const stem = t.endsWith("*");
    const core = escapeRegex(stem ? t.slice(0, -1) : t);
    return new RegExp("(^|[^a-z0-9])" + core + (stem ? "" : "(?![a-z0-9])"));
  }

  function hasTerm(text, term) {
    return termRegex(term).test(text);
  }

  function words(text) {
    const n = normalize(text);
    return n ? n.split(" ").filter((w) => /[a-z0-9]/.test(w)) : [];
  }

  function tokens(text) {
    return new Set(words(text).map((w) => w.replace(/[^a-z0-9']/g, "")).filter(Boolean));
  }

  // 0 means identical word sets, 1 means nothing in common.
  function changeRatio(a, b) {
    const A = tokens(a), B = tokens(b);
    if (!A.size && !B.size) return 0;
    let shared = 0;
    for (const t of A) if (B.has(t)) shared++;
    return 1 - shared / (A.size + B.size - shared);
  }

  // Each runner returns { met, detail? }.
  const RUNNERS = {
    anyOf(check, text) {
      const hit = (check.terms || []).find((t) => hasTerm(text, t));
      return { met: Boolean(hit), detail: hit ? { matched: hit } : undefined };
    },
    allOf(check, text) {
      const missing = (check.groups || []).filter((g) => !g.some((t) => hasTerm(text, t)));
      return { met: missing.length === 0, detail: { missingGroups: missing.length } };
    },
    absent(check, text) {
      const found = [];
      for (const t of check.terms || []) if (hasTerm(text, t)) found.push(t);
      for (const p of check.patterns || []) {
        const m = text.match(new RegExp(p, "i"));
        if (m) found.push(m[0]);
      }
      return { met: found.length === 0, detail: found.length ? { found } : undefined };
    },
    minWords(check, text) {
      const n = words(text).length;
      return { met: n >= check.min, detail: { count: n } };
    },
    maxWords(check, text) {
      const n = words(text).length;
      return { met: n > 0 && n <= check.max, detail: { count: n } };
    },
    pattern(check, text) {
      return { met: new RegExp(check.regex, check.flags || "i").test(text) };
    },
    differsFrom(check, text) {
      const ratio = changeRatio(text, check.text);
      return { met: ratio >= (check.min == null ? 0.4 : check.min), detail: { ratio: Math.round(ratio * 100) / 100 } };
    },
    choice(check, _text, input) {
      return { met: input.choice === check.correct, detail: { picked: input.choice || null } };
    }
  };

  function inputText(input, field) {
    if (input == null) return "";
    if (typeof input === "string") return field ? "" : input;
    return String((field ? input[field] : input.text) || "");
  }

  function isEmptyInput(lab, input) {
    if (lab.type === "choice") return !input || !input.choice;
    if (lab.type === "flag") return false; // ticking nothing is a valid (if weak) answer
    return !normalize(inputText(input)).length;
  }

  // Flag labs score hits against the answer key, with a half-point penalty per false alarm.
  function gradeFlags(lab, input, check) {
    const picked = new Set((input && input.flags) || []);
    const sentences = lab.attempt.sentences;
    const suspects = sentences.filter((s) => s.suspect);
    const hits = suspects.filter((s) => picked.has(s.id)).map((s) => s.id);
    const missed = suspects.filter((s) => !picked.has(s.id)).map((s) => s.id);
    const falseAlarms = sentences.filter((s) => !s.suspect && picked.has(s.id)).map((s) => s.id);
    const raw = (hits.length - 0.5 * falseAlarms.length) / suspects.length;
    const fraction = Math.max(0, Math.min(1, raw));
    return {
      fraction,
      result: {
        id: check.id,
        label: check.label,
        weight: check.weight || 1,
        met: missed.length === 0 && falseAlarms.length === 0,
        message: missed.length === 0 && falseAlarms.length === 0 ? check.note : check.tip,
        detail: { hits, missed, falseAlarms }
      }
    };
  }

  function grade(lab, input) {
    if (!lab || !Array.isArray(lab.checks)) throw new Error("grade() needs a lab with checks.");
    if (isEmptyInput(lab, input)) {
      return {
        labId: lab.id,
        empty: true,
        score: 0,
        passed: false,
        checks: [],
        summary: lab.type === "choice" ? "Pick one of the options first." : "Type your attempt first, then check it."
      };
    }
    let earned = 0, total = 0;
    const checks = [];
    for (const check of lab.checks) {
      const weight = check.weight || 1;
      total += weight;
      if (check.type === "flags") {
        const r = gradeFlags(lab, input, check);
        earned += weight * r.fraction;
        checks.push(r.result);
        continue;
      }
      const runner = RUNNERS[check.type];
      if (!runner) throw new Error("Unknown check type: " + check.type);
      const text = normalize(inputText(input, check.field));
      const { met, detail } = runner(check, text, typeof input === "object" && input ? input : { text: input });
      if (met) earned += weight;
      checks.push({ id: check.id, label: check.label, weight, met, message: met ? check.note : check.tip, detail });
    }
    const score = total ? Math.round((earned / total) * 100) : 0;
    const passed = score >= (lab.passScore == null ? 75 : lab.passScore);
    const misses = checks.filter((c) => !c.met);
    let summary;
    if (passed && !misses.length) summary = "Every check passed. This is the habit, done well.";
    else if (passed) summary = "Passed. One small thing would make it even stronger: " + misses[0].message;
    else summary = "Not there yet. Start with this: " + misses[0].message;
    return { labId: lab.id, empty: false, score, passed, checks, summary };
  }

  // What changed between two graded attempts, for the "you improved" line after a retry.
  function compareResults(previous, current) {
    if (!previous || !current || previous.empty || current.empty) return null;
    const before = new Map(previous.checks.map((c) => [c.id, c.met]));
    const gained = [], lost = [];
    for (const c of current.checks) {
      if (!before.has(c.id)) continue;
      if (c.met && !before.get(c.id)) gained.push(c.label);
      if (!c.met && before.get(c.id)) lost.push(c.label);
    }
    return { scoreDelta: current.score - previous.score, gained, lost };
  }

  return { grade, compareResults, normalize, hasTerm, changeRatio, words };
});
