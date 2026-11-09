// AI Foundations Studio: saved progress.
// Lives in the browser's localStorage. Falls back to memory when storage is blocked,
// recovers from corrupted data, and can export, import, and share a privacy-safe summary code.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  const SCHEMA_VERSION = 1;
  const DEFAULT_KEY = "af-studio-v1";
  const MAX_ATTEMPTS = 20;
  const CODE_PREFIX = "AF1.";

  function emptyState() {
    return { version: SCHEMA_VERSION, learner: "", labs: {}, drafts: {}, workshop: false };
  }

  function memoryStorage() {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      _keys: () => Array.from(m.keys())
    };
  }

  function probe(storage) {
    try {
      const k = "__af_probe__";
      storage.setItem(k, "1");
      storage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function isObj(v) {
    return v != null && typeof v === "object" && !Array.isArray(v);
  }

  // Keep only well-formed fields. Anything unexpected is dropped rather than trusted.
  function sanitizeAttempt(a) {
    if (!isObj(a) || typeof a.at !== "string" || typeof a.score !== "number") return null;
    return {
      at: a.at,
      score: Math.max(0, Math.min(100, Math.round(a.score))),
      passed: Boolean(a.passed),
      input: isObj(a.input) ? a.input : { text: String(a.input == null ? "" : a.input) },
      met: Array.isArray(a.met) ? a.met.filter((x) => typeof x === "string") : [],
      missed: Array.isArray(a.missed) ? a.missed.filter((x) => typeof x === "string") : []
    };
  }

  function sanitizeState(raw) {
    if (!isObj(raw)) throw new Error("Saved progress is not an object.");
    if (raw.version !== SCHEMA_VERSION) throw new Error("Saved progress has an unknown version: " + raw.version);
    const s = emptyState();
    s.learner = typeof raw.learner === "string" ? raw.learner.slice(0, 60) : "";
    s.workshop = Boolean(raw.workshop);
    if (isObj(raw.drafts)) {
      for (const [k, v] of Object.entries(raw.drafts)) if (isObj(v) || typeof v === "string") s.drafts[k] = v;
    }
    if (isObj(raw.labs)) {
      for (const [id, lab] of Object.entries(raw.labs)) {
        if (!isObj(lab) || !Array.isArray(lab.attempts)) continue;
        const attempts = lab.attempts.map(sanitizeAttempt).filter(Boolean).slice(-MAX_ATTEMPTS);
        s.labs[id] = { attempts };
      }
    }
    return s;
  }

  function summarizeLab(labState) {
    const attempts = (labState && labState.attempts) || [];
    if (!attempts.length) return { status: "new", attempts: 0, best: 0, last: null };
    const best = Math.max(...attempts.map((a) => a.score));
    const passed = attempts.some((a) => a.passed);
    return { status: passed ? "passed" : "trying", attempts: attempts.length, best, last: attempts[attempts.length - 1] };
  }

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function b64decode(code) {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  // A class code carries scores and which checks were missed, never the learner's typed text.
  function encodeClassCode(summary) {
    return CODE_PREFIX + b64encode(JSON.stringify(summary));
  }

  function decodeClassCode(code) {
    const c = String(code || "").trim();
    if (!c.startsWith(CODE_PREFIX)) throw new Error("This does not look like a Studio progress code (it should start with " + CODE_PREFIX + ").");
    let data;
    try {
      data = JSON.parse(b64decode(c.slice(CODE_PREFIX.length)));
    } catch (e) {
      throw new Error("This progress code is damaged or incomplete. Ask for it to be copied again.");
    }
    if (!isObj(data) || !isObj(data.labs)) throw new Error("This progress code is missing its lab results.");
    const out = { name: typeof data.n === "string" && data.n.trim() ? data.n.trim().slice(0, 60) : "Unnamed learner", labs: {} };
    for (const [id, l] of Object.entries(data.labs)) {
      if (!isObj(l)) continue;
      out.labs[id] = {
        best: Math.max(0, Math.min(100, Number(l.b) || 0)),
        attempts: Math.max(0, Number(l.a) || 0),
        passed: Boolean(l.p),
        missed: Array.isArray(l.m) ? l.m.filter((x) => typeof x === "string") : []
      };
    }
    return out;
  }

  function createStore(options) {
    const opts = options || {};
    const key = opts.key || DEFAULT_KEY;
    const now = opts.now || (() => new Date().toISOString());
    let storage = opts.storage;
    let persistent = Boolean(storage) && probe(storage);
    if (!persistent) storage = memoryStorage();
    let state = emptyState();
    const listeners = [];

    function emit() {
      for (const fn of listeners) fn(state);
    }

    // Returns a notice string when something needed recovering, otherwise null.
    function load() {
      let raw;
      try {
        raw = storage.getItem(key);
      } catch (e) {
        persistent = false;
        storage = memoryStorage();
        state = emptyState();
        return "This browser blocked saving, so progress will last only until you close the page. Use Save or move my progress to keep a copy.";
      }
      if (raw == null) {
        state = emptyState();
        return persistent ? null : "This browser blocked saving, so progress will last only until you close the page. Use Save or move my progress to keep a copy.";
      }
      try {
        state = sanitizeState(JSON.parse(raw));
        return null;
      } catch (e) {
        const backupKey = key + "-damaged-" + now().replace(/[^0-9]/g, "");
        try {
          storage.setItem(backupKey, raw);
        } catch (e2) {
          /* best effort */
        }
        state = emptyState();
        write();
        return "Your saved progress could not be read, so the Studio started fresh. The old data was kept in this browser under \"" + backupKey + "\" in case you need it.";
      }
    }

    // Saves, trimming stored attempt text if the browser runs out of room.
    function write() {
      const payload = JSON.stringify(state);
      try {
        storage.setItem(key, payload);
        return null;
      } catch (e) {
        for (const lab of Object.values(state.labs)) {
          lab.attempts = lab.attempts.slice(-3);
        }
        try {
          storage.setItem(key, JSON.stringify(state));
          return "Browser storage is nearly full, so older attempts were trimmed to the last three per lab.";
        } catch (e2) {
          return "Could not save to this browser. Use Save or move my progress to keep a copy.";
        }
      }
    }

    function labState(id) {
      if (!state.labs[id]) state.labs[id] = { attempts: [] };
      return state.labs[id];
    }

    function recordAttempt(labId, input, result) {
      const lab = labState(labId);
      lab.attempts.push({
        at: now(),
        score: result.score,
        passed: result.passed,
        input: typeof input === "string" ? { text: input } : JSON.parse(JSON.stringify(input || {})),
        met: result.checks.filter((c) => c.met).map((c) => c.id),
        missed: result.checks.filter((c) => !c.met).map((c) => c.id)
      });
      if (lab.attempts.length > MAX_ATTEMPTS) lab.attempts = lab.attempts.slice(-MAX_ATTEMPTS);
      delete state.drafts[labId];
      const notice = write();
      emit();
      return notice;
    }

    function saveDraft(labId, draft) {
      state.drafts[labId] = draft;
      return write();
    }

    function setLearner(name) {
      state.learner = String(name || "").trim().slice(0, 60);
      const n = write();
      emit();
      return n;
    }

    function setWorkshop(on) {
      state.workshop = Boolean(on);
      const n = write();
      emit();
      return n;
    }

    function reset() {
      state = emptyState();
      const n = write();
      emit();
      return n;
    }

    function exportJSON() {
      return JSON.stringify({ app: "ai-foundations-studio", exportedAt: now(), state }, null, 2);
    }

    // Merges an exported file into current progress. Attempts are combined and de-duplicated by time.
    function importJSON(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new Error("That file is not a Studio progress file (it is not valid JSON).");
      }
      const incoming = sanitizeState(isObj(parsed) && parsed.state ? parsed.state : parsed);
      let added = 0;
      for (const [id, lab] of Object.entries(incoming.labs)) {
        const mine = labState(id);
        const seen = new Set(mine.attempts.map((a) => a.at + "|" + a.score));
        for (const a of lab.attempts) {
          const k = a.at + "|" + a.score;
          if (!seen.has(k)) {
            mine.attempts.push(a);
            seen.add(k);
            added++;
          }
        }
        mine.attempts.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
        mine.attempts = mine.attempts.slice(-MAX_ATTEMPTS);
      }
      if (!state.learner && incoming.learner) state.learner = incoming.learner;
      const notice = write();
      emit();
      return { added, notice };
    }

    function classCode(labIds) {
      const labs = {};
      for (const id of labIds || Object.keys(state.labs)) {
        const s = summarizeLab(state.labs[id]);
        if (!s.attempts) continue;
        labs[id] = { b: s.best, a: s.attempts, p: s.status === "passed" ? 1 : 0, m: s.last ? s.last.missed : [] };
      }
      return encodeClassCode({ n: state.learner, labs });
    }

    return {
      load,
      get state() {
        return state;
      },
      get persistent() {
        return persistent;
      },
      summary: (id) => summarizeLab(state.labs[id]),
      attempts: (id) => ((state.labs[id] && state.labs[id].attempts) || []).slice(),
      draft: (id) => state.drafts[id],
      recordAttempt,
      saveDraft,
      setLearner,
      setWorkshop,
      reset,
      exportJSON,
      importJSON,
      classCode,
      onChange: (fn) => listeners.push(fn)
    };
  }

  return { createStore, encodeClassCode, decodeClassCode, summarizeLab, memoryStorage, SCHEMA_VERSION, MAX_ATTEMPTS };
});
