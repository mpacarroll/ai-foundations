// AI Foundations Studio: the browser interface.
// All logic that matters (grading, saving, class board) lives in the tested modules; this file wires them to the page.
(function () {
  "use strict";
  const S = window.AFStudio;
  const COURSE = S.COURSE;
  const LABS = COURSE.labs;

  let storage = null;
  try { storage = window.localStorage; } catch (e) { storage = null; }
  const store = S.createStore({ storage });
  const view = document.getElementById("view");
  const show = (...nodes) => view.replaceChildren(...nodes.filter(Boolean));

  // ---------- small DOM helpers (text only, never innerHTML with user content) ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "style") el.setAttribute("style", v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === "string" || typeof kid === "number" ? document.createTextNode(String(kid)) : kid);
    }
    return el;
  }
  const $ = (id) => document.getElementById(id);
  const labById = (id) => LABS.find((l) => l.id === id);
  const labIndex = (id) => LABS.findIndex((l) => l.id === id);

  function showNotice(msg) {
    const n = $("notice");
    if (!msg) { n.hidden = true; return; }
    n.replaceChildren(document.createTextNode(msg), h("button", { type: "button", class: "btn ghost small", onclick: () => (n.hidden = true) }, "Dismiss"));
    n.hidden = false;
  }

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  // ---------- sidebar ----------
  function renderNav(activeId) {
    const nav = $("labnav");
    nav.replaceChildren(...LABS.map((lab) => {
      const s = store.summary(lab.id);
      const meta = s.status === "passed" ? "Passed, best " + s.best + "%" : s.status === "trying" ? "In progress, best " + s.best + "%" : lab.minutes + " min";
      return h("li", {}, h("a", { href: "#/lab/" + lab.id + "/learn", "data-status": s.status, "aria-current": lab.id === activeId ? "page" : null },
        h("span", {}, lab.title, h("span", { class: "meta" }, meta))));
    }));
    const passed = LABS.filter((l) => store.summary(l.id).status === "passed").length;
    $("progress-label").textContent = passed + " of " + LABS.length + " labs passed";
    $("progress-bar").style.width = Math.round((passed / LABS.length) * 100) + "%";
    const ws = store.state.workshop;
    $("toggle-workshop").setAttribute("aria-pressed", String(ws));
    $("workshop-link").hidden = !ws;
  }

  function nextUnpassed() {
    return LABS.find((l) => store.summary(l.id).status !== "passed");
  }

  // ---------- overview ----------
  function renderHome() {
    const next = nextUnpassed();
    const started = LABS.some((l) => store.summary(l.id).attempts);
    show(
      h("section", { class: "card" },
        h("span", { class: "tag" }, "Beginner course"),
        h("h2", {}, COURSE.title),
        h("p", {}, COURSE.summary),
        h("p", { class: "muted" }, "Each lab has three steps: Learn the habit and compare a weak and a strong example, Try it yourself, then get Feedback and revise as many times as you like. Your work saves in this browser as you go."),
        h("div", { class: "actions" },
          next
            ? h("a", { class: "btn", href: "#/lab/" + next.id + "/learn" }, started ? "Continue: " + next.title : "Start the first lab")
            : h("a", { class: "btn", href: "#/done" }, "See my results"),
          h("button", { type: "button", class: "btn ghost", onclick: () => $("dlg-limits").showModal() }, "How the feedback works"))),
      h("section", { class: "card" },
        h("h3", {}, "What you will practice"),
        h("ol", {}, LABS.map((l) => h("li", {}, h("b", {}, l.title + ". "), l.learn.idea)))),
      store.state.workshop ? h("section", { class: "card facil" },
        h("h3", {}, "Running this as a workshop"),
        h("p", {}, "Workshop mode adds facilitator notes and timings to every lab, plus a board that combines learners' progress codes so you can see where the room is stuck."),
        h("a", { class: "btn small", href: "#/workshop" }, "Open the workshop board")) : null
    );
  }

  // ---------- lab ----------
  function lastResult(lab) {
    const list = store.attempts(lab.id);
    if (!list.length) return null;
    const cur = S.grade(lab, list[list.length - 1].input);
    const prev = list.length > 1 ? S.grade(lab, list[list.length - 2].input) : null;
    return { cur, prev, attempt: list[list.length - 1], count: list.length };
  }

  function stepTabs(lab, step) {
    const hasResult = store.attempts(lab.id).length > 0;
    const tabs = [["learn", "1. Learn"], ["try", "2. Try it"], ["feedback", "3. Feedback"]];
    return h("div", { class: "steps", role: "tablist", "aria-label": "Lab steps" }, tabs.map(([key, label]) =>
      h("button", {
        type: "button", class: "step", role: "tab", "aria-selected": String(step === key),
        disabled: key === "feedback" && !hasResult ? true : null,
        onclick: () => go("#/lab/" + lab.id + "/" + key)
      }, label)));
  }

  function facilitatorCard(lab) {
    if (!store.state.workshop) return null;
    const f = lab.facilitator;
    return h("section", { class: "card facil", "aria-label": "Facilitator notes" },
      h("span", { class: "tag" }, "Facilitator notes, " + f.minutes + " minutes"),
      h("p", {}, h("b", {}, "Set up: "), f.setup),
      h("b", {}, "Discuss:"),
      h("ul", {}, f.discuss.map((d) => h("li", {}, d))),
      h("p", { style: "margin:8px 0 0" }, h("b", {}, "Watch for: "), f.watchFor));
  }

  function renderLab(lab, step) {
    const i = labIndex(lab.id);
    const s = store.summary(lab.id);
    const status = s.status === "passed" ? "Passed" : s.status === "trying" ? "In progress" : "Not started";
    let body;
    if (step === "try") body = renderTry(lab);
    else if (step === "feedback" && s.attempts) body = renderFeedback(lab);
    else body = renderLearn(lab);
    show(
      facilitatorCard(lab),
      h("section", { class: "card" },
        h("div", { class: "labhead" },
          h("span", { class: "tag" }, "Lab " + (i + 1) + " of " + LABS.length + ", about " + lab.minutes + " minutes"),
          h("span", { class: "small muted", "data-testid": "lab-status" }, status + (s.attempts ? ", best " + s.best + "%" : ""))),
        h("h2", {}, lab.title),
        stepTabs(lab, step),
        body));
  }

  function renderLearn(lab) {
    return h("div", {},
      h("p", { class: "idea" }, lab.learn.idea),
      lab.learn.body.map((p) => h("p", {}, p)),
      h("h3", {}, "Compare two approaches"),
      h("div", { class: "compare" }, lab.learn.compare.map((c) =>
        h("article", { class: "cmp " + c.verdict },
          h("span", { class: "verdict" }, c.verdict === "strong" ? "Works" : "Falls short"),
          h("h4", {}, c.label),
          h("div", { class: "small muted" }, "You type:"),
          h("pre", {}, c.prompt),
          h("div", { class: "small muted" }, "Sample reply:"),
          h("div", { class: "quote" }, c.reply),
          h("p", { style: "margin:0" }, h("b", {}, "Why: "), c.why)))),
      h("p", { class: "caption" }, "Sample replies were written by hand for this lesson. A real AI tool will word things differently each time."),
      h("div", { class: "actions" }, h("a", { class: "btn", href: "#/lab/" + lab.id + "/try" }, "Try it yourself")));
  }

  // The editor starts from: an unsent draft, else the last attempt, else the starter text.
  function startingInput(lab) {
    const d = store.draft(lab.id);
    if (d) return d;
    const list = store.attempts(lab.id);
    if (list.length) return list[list.length - 1].input;
    if (lab.type === "flag") return { flags: [] };
    if (lab.type === "choice") return { choice: "", why: "" };
    return { text: lab.attempt.starter || "" };
  }

  let draftTimer = null;
  let pendingDraft = null; // saves the draft now; set while a save is queued
  function flushDraft() {
    clearTimeout(draftTimer);
    if (pendingDraft) { const f = pendingDraft; pendingDraft = null; f(); }
  }
  function renderTry(lab) {
    const a = lab.attempt;
    const start = startingInput(lab);
    const savedLine = h("span", { class: "saved", "aria-live": "polite" });
    let readInput;
    const queueDraft = () => {
      clearTimeout(draftTimer);
      pendingDraft = () => {
        const note = store.saveDraft(lab.id, readInput());
        savedLine.textContent = note || (store.persistent ? "Draft saved" : "Draft kept for this visit");
      };
      draftTimer = setTimeout(flushDraft, 400);
    };
    let field;
    if (lab.type === "choice") {
      const radios = a.options.map((o) => h("input", { type: "radio", name: "choice", value: o.id, checked: start.choice === o.id ? true : null, onchange: queueDraft }));
      const why = h("textarea", { id: "why", placeholder: a.whyPlaceholder, oninput: queueDraft, style: "min-height:80px" });
      why.value = start.why || "";
      field = h("div", {},
        h("fieldset", {}, h("legend", { class: "lbl" }, "Which approach?"),
          a.options.map((o, idx) => h("label", { class: "opt" }, radios[idx], h("span", {}, h("b", {}, o.id + ". "), o.text)))),
        h("label", { for: "why" }, "Why? One sentence is enough."), why);
      readInput = () => ({ choice: (radios.find((r) => r.checked) || {}).value || "", why: why.value });
    } else if (lab.type === "flag") {
      const picked = new Set(start.flags || []);
      const boxes = a.sentences.map((s) => h("input", { type: "checkbox", value: s.id, checked: picked.has(s.id) ? true : null, onchange: queueDraft }));
      field = h("fieldset", {}, h("legend", { class: "lbl" }, "The AI's reply, one sentence per line"),
        a.sentences.map((s, idx) => h("label", { class: "opt" }, boxes[idx], h("span", {}, s.text))));
      readInput = () => ({ flags: boxes.filter((b) => b.checked).map((b) => b.value) });
    } else {
      const ta = h("textarea", { id: "attempt", placeholder: a.placeholder || "", oninput: queueDraft, spellcheck: "true" });
      ta.value = start.text || "";
      field = h("div", {}, h("label", { for: "attempt" }, lab.type === "redact" ? "Edit the request" : "Your prompt"), ta,
        a.starter ? h("button", { type: "button", class: "btn ghost small", style: "margin-top:8px",
          onclick: () => { ta.value = a.starter; queueDraft(); ta.focus(); } }, "Reset to the starting text") : null);
      readInput = () => ({ text: ta.value });
    }
    const err = h("p", { class: "small", role: "alert", style: "color:var(--red);margin:8px 0 0" });
    const submit = () => {
      const input = readInput();
      const result = S.grade(lab, input);
      if (result.empty) { err.textContent = result.summary; return; }
      clearTimeout(draftTimer);
      pendingDraft = null;
      const note = store.recordAttempt(lab.id, input, result);
      if (note) showNotice(note);
      go("#/lab/" + lab.id + "/feedback");
    };
    return h("div", {},
      h("div", { class: "scenario" }, h("b", {}, "The situation: "), a.scenario),
      h("p", {}, h("b", {}, a.instruction)),
      field,
      err,
      h("div", { class: "actions" }, h("button", { type: "button", class: "btn", id: "check", onclick: submit }, "Check my attempt"), savedLine));
  }

  function renderFeedback(lab) {
    const r = lastResult(lab);
    const { cur, prev } = r;
    const diff = S.compareResults(prev, cur);
    const i = labIndex(lab.id);
    const next = LABS[i + 1];
    const parts = [];
    parts.push(h("div", { class: "score" },
      h("div", { class: "dial" + (cur.passed ? "" : " fail"), style: "--p:" + cur.score, role: "img", "aria-label": "Score " + cur.score + " percent" }, h("span", {}, cur.score + "%")),
      h("div", {},
        h("div", { class: "verdictline", "data-testid": "verdict" }, cur.passed ? "Passed" : "Not yet. Revise and try again."),
        h("div", { class: "muted" }, cur.summary),
        h("div", { class: "small muted" }, "Attempt " + r.count + ", checked " + fmtTime(r.attempt.at)))));
    if (diff) {
      const bits = [];
      if (diff.scoreDelta) bits.push((diff.scoreDelta > 0 ? "Up " : "Down ") + Math.abs(diff.scoreDelta) + " points from your last attempt.");
      else bits.push("Same score as your last attempt.");
      if (diff.gained.length) bits.push("Newly passing: " + diff.gained.join(", ") + ".");
      if (diff.lost.length) bits.push("Slipped: " + diff.lost.join(", ") + ".");
      parts.push(h("p", { class: "delta", "data-testid": "delta" }, bits.join(" ")));
    }
    parts.push(h("ul", { class: "checks" }, cur.checks.map((c) =>
      h("li", { class: c.met ? "met" : "miss" }, h("b", {}, c.label), h("span", { class: "why" }, c.message),
        c.detail && c.detail.found ? h("span", { class: "why" }, "Still in your text: " + c.detail.found.join(", ")) : null))));
    if (lab.type === "flag") {
      const picked = new Set(r.attempt.input.flags || []);
      parts.push(h("h3", {}, "Sentence by sentence"));
      parts.push(h("div", {}, lab.attempt.sentences.map((s) => {
        const flagged = picked.has(s.id);
        const right = flagged === s.suspect;
        return h("div", { class: "sent" },
          h("span", { class: "mark " + (right ? "ok" : "bad") }, right ? "RIGHT" : flagged ? "EXTRA" : "MISSED"),
          h("span", {}, s.text, flagged ? h("span", { class: "muted small" }, " (you flagged this)") : null),
          h("span", { class: "explain" }, s.explain));
      })));
    }
    if (lab.type === "choice") {
      const pick = r.attempt.input.choice;
      const shown = cur.passed ? lab.attempt.options : lab.attempt.options.filter((o) => o.id === pick);
      parts.push(h("h3", {}, cur.passed ? "About each option" : "About your pick"));
      parts.push(h("div", {}, shown.map((o) => h("p", {}, h("b", {}, o.id + (o.id === pick ? " (your pick): " : ": ")), o.feedback))));
    }
    parts.push(h("div", { class: "actions" },
      h("a", { class: cur.passed ? "btn ghost" : "btn", href: "#/lab/" + lab.id + "/try" }, cur.passed ? "Try another version" : "Revise and try again"),
      next ? h("a", { class: cur.passed ? "btn" : "btn ghost", href: "#/lab/" + next.id + "/learn" }, cur.passed ? "Next lab: " + next.title : "Skip to the next lab")
        : h("a", { class: "btn", href: "#/done" }, "See my results")));
    parts.push(historyTable(lab));
    parts.push(h("p", { class: "caption" }, "Feedback comes from fixed rules, not an AI. ",
      h("button", { type: "button", class: "btn ghost small", onclick: () => $("dlg-limits").showModal() }, "What the rules can and cannot judge")));
    return h("div", {}, parts);
  }

  function historyTable(lab) {
    const list = store.attempts(lab.id);
    if (list.length < 2) return null;
    return h("details", { style: "margin-top:18px" },
      h("summary", {}, "Your attempts (" + list.length + ")"),
      h("div", { class: "tablewrap" }, h("table", {},
        h("thead", {}, h("tr", {}, h("th", {}, "#"), h("th", {}, "When"), h("th", {}, "Score"), h("th", {}, "What you sent"), h("th", {}, ""))),
        h("tbody", {}, list.map((a, idx) => h("tr", {},
          h("td", {}, idx + 1), h("td", {}, fmtTime(a.at)),
          h("td", { class: a.passed ? "pass" : "try" }, a.score + "%"),
          h("td", { class: "small" }, describeInput(lab, a.input)),
          h("td", {}, h("button", { type: "button", class: "btn ghost small", onclick: () => { store.saveDraft(lab.id, a.input); go("#/lab/" + lab.id + "/try"); } }, "Edit this one"))))))));
  }

  function describeInput(lab, input) {
    if (lab.type === "choice") return "Picked " + (input.choice || "nothing") + (input.why ? ": " + input.why : "");
    if (lab.type === "flag") return (input.flags || []).length + " sentences flagged";
    const t = input.text || "";
    return t.length > 120 ? t.slice(0, 117) + "..." : t;
  }

  // ---------- results ----------
  function renderDone() {
    const passed = LABS.filter((l) => store.summary(l.id).status === "passed").length;
    const all = passed === LABS.length;
    show(
      h("section", { class: "card" },
        h("span", { class: "tag" }, "My results"),
        h("h2", {}, all ? "You finished " + COURSE.title : passed + " of " + LABS.length + " labs passed"),
        h("p", {}, all ? "That is the foundation. Every habit here works in any AI tool. Pick one real task this week and use them." : "Keep going when you are ready. Your work is saved in this browser."),
        h("div", { class: "tablewrap" }, h("table", {},
          h("thead", {}, h("tr", {}, h("th", {}, "Lab"), h("th", {}, "Status"), h("th", {}, "Best"), h("th", {}, "Attempts"))),
          h("tbody", {}, LABS.map((l) => {
            const s = store.summary(l.id);
            return h("tr", {}, h("td", {}, h("a", { href: "#/lab/" + l.id + "/" + (s.attempts ? "feedback" : "learn") }, l.title)),
              h("td", { class: s.status === "passed" ? "pass" : s.status === "trying" ? "try" : "" }, s.status === "passed" ? "Passed" : s.status === "trying" ? "In progress" : "Not started"),
              h("td", {}, s.attempts ? s.best + "%" : ""), h("td", {}, s.attempts || ""));
          })))),
        h("div", { class: "actions" },
          nextUnpassed() ? h("a", { class: "btn", href: "#/lab/" + nextUnpassed().id + "/learn" }, "Continue") : null,
          h("button", { type: "button", class: "btn ghost", onclick: openProgress }, "Share with an instructor or save a copy"),
          h("button", { type: "button", class: "btn ghost", onclick: () => window.print() }, "Print"))),
      h("section", { class: "card" }, h("h3", {}, "The six habits"),
        h("ol", {}, LABS.map((l) => h("li", {}, l.learn.idea)))));
  }

  // ---------- workshop ----------
  const timer = { labId: LABS[0].id, remaining: LABS[0].facilitator.minutes * 60, running: false, handle: null, paint: () => {} };
  let boardText = "";

  function renderWorkshop() {
    if (!store.state.workshop) { store.setWorkshop(true); }
    const agenda = S.buildAgenda(COURSE);
    const clock = h("div", { class: "timer", "data-testid": "timer" });
    const paint = () => {
      const m = Math.floor(Math.abs(timer.remaining) / 60), s = Math.abs(timer.remaining) % 60;
      clock.textContent = (timer.remaining < 0 ? "+" : "") + m + ":" + String(s).padStart(2, "0");
      clock.classList.toggle("over", timer.remaining < 0);
    };
    timer.paint = paint; // the running interval always repaints the clock currently on screen
    const startBtn = h("button", { type: "button", class: "btn small" }, timer.running ? "Pause" : "Start");
    startBtn.addEventListener("click", () => {
      timer.running = !timer.running;
      startBtn.textContent = timer.running ? "Pause" : "Start";
      clearInterval(timer.handle);
      if (timer.running) timer.handle = setInterval(() => { timer.remaining--; timer.paint(); }, 1000);
    });
    const select = h("select", { "aria-label": "Lab to time", style: "padding:8px;border-radius:6px;border:1.5px solid var(--line);background:var(--stone);color:var(--ink);font:inherit",
      onchange: (e) => { timer.labId = e.target.value; timer.remaining = labById(timer.labId).facilitator.minutes * 60; paint(); } },
      LABS.map((l) => h("option", { value: l.id, selected: l.id === timer.labId ? true : null }, l.title)));
    paint();

    const codes = h("textarea", { id: "codes", placeholder: "Paste progress codes here, one per line. Each starts with AF1.", style: "min-height:110px;font-family:var(--mono);font-size:.82rem" });
    codes.value = boardText;
    const board = h("div", { id: "board" });
    const build = () => { boardText = codes.value; board.replaceChildren(renderBoard(codes.value)); };

    show(
      h("section", { class: "card" },
        h("span", { class: "tag" }, "Workshop mode"),
        h("h2", {}, "Run this course with a group"),
        h("p", {}, "Project this page or keep it on your own screen. Learners work through the labs on their own devices, then send you their progress code from Save or move my progress. Codes carry scores only, never what anyone typed."),
        h("div", { class: "tablewrap" }, h("table", { class: "agenda" },
          h("thead", {}, h("tr", {}, h("th", {}, "Starts"), h("th", {}, "Minutes"), h("th", {}, "Segment"))),
          h("tbody", {}, agenda.items.map((it) => h("tr", {}, h("td", {}, S.formatClock(it.at)), h("td", {}, it.minutes),
            h("td", {}, it.labId ? h("a", { href: "#/lab/" + it.labId + "/learn" }, it.title) : it.title)))))),
        h("p", { class: "small muted" }, "Total: about " + agenda.totalMinutes + " minutes. Facilitator notes appear at the top of every lab while workshop mode is on.")),
      h("section", { class: "card" },
        h("h3", {}, "Lab timer"),
        h("div", { class: "actions", style: "margin-top:4px" }, select, clock, startBtn,
          h("button", { type: "button", class: "btn ghost small", onclick: () => { timer.remaining = labById(timer.labId).facilitator.minutes * 60; paint(); } }, "Reset"))),
      h("section", { class: "card" },
        h("h3", {}, "Class board"),
        h("label", { for: "codes" }, "Learners' progress codes"),
        codes,
        h("div", { class: "actions" },
          h("button", { type: "button", class: "btn", id: "build-board", onclick: build }, "Build the class board"),
          h("button", { type: "button", class: "btn ghost", id: "demo-class", onclick: () => { codes.value = S.DEMO_CLASS.map(S.encodeClassCode).join("\n"); build(); } }, "Load a demo class"),
          h("button", { type: "button", class: "btn ghost", onclick: () => { codes.value = ""; build(); } }, "Clear")),
        board),
      h("section", { class: "card" },
        h("h3", {}, "Shared computers"),
        h("p", { class: "small" }, "Between learners on one device: ask them to copy their progress code first, then clear this device."),
        h("div", { class: "actions" }, h("button", { type: "button", class: "btn ghost warn", onclick: resetForNext }, "Clear progress for the next learner"))));
    if (boardText) build();
  }

  function renderBoard(text) {
    const { learners, errors } = S.parseCodes(text, S.decodeClassCode);
    const out = [];
    const bad = errors.filter((e) => !e.duplicate), dupes = errors.filter((e) => e.duplicate);
    if (bad.length) out.push(h("p", { class: "notice", role: "alert" }, bad.map((e) => "Code " + e.index + ": " + e.message).join(" ")));
    if (dupes.length) out.push(h("p", { class: "small muted", "data-testid": "dupes" }, dupes.map((e) => "Code " + e.index + ": " + e.message).join(" ")));
    if (!learners.length) { out.push(h("p", { class: "muted" }, "No codes yet. Paste some, or load the demo class to see how the board works.")); return h("div", {}, out); }
    const agg = S.aggregateClass(COURSE, learners);
    out.push(h("p", { "data-testid": "board-count" }, agg.learnerCount + " learner" + (agg.learnerCount === 1 ? "" : "s") + " on the board."));
    if (agg.focus) {
      out.push(h("p", { class: "notice", "data-testid": "focus" }, h("b", {}, "Where to spend group time: "),
        agg.focus.title + ". " + agg.focus.stuck + (agg.focus.stuck === 1 ? " learner has" : " learners have") + " tried it without passing yet." +
        (agg.focus.topMiss ? " Most common gap: " + agg.focus.topMiss.label.toLowerCase() + "." : "")));
    }
    out.push(h("div", { class: "stats" }, agg.labs.map((s) => h("div", { class: "stat" },
      h("b", {}, s.title),
      h("span", { class: "small muted" }, s.tried ? s.passed + " of " + s.tried + " passed, average best " + s.averageBest + "%" : "Nobody has tried this yet"),
      s.topMiss ? h("div", { class: "small" }, "Most missed: " + s.topMiss.label + " (" + s.topMiss.count + ")") : null))));
    out.push(h("div", { class: "tablewrap" }, h("table", { "data-testid": "board-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Learner"), LABS.map((l, i) => h("th", { title: l.title }, "Lab " + (i + 1))), h("th", {}, "Passed"))),
      h("tbody", {}, agg.rows.map((r) => h("tr", {}, h("td", {}, r.name),
        r.cells.map((c) => c ? h("td", { class: c.passed ? "pass" : "try" }, c.best + "%" + (c.attempts > 1 ? " (" + c.attempts + ")" : "")) : h("td", { class: "muted" }, "")),
        h("td", {}, r.passedCount + "/" + LABS.length)))))));
    out.push(h("p", { class: "small muted" }, "Numbers in brackets are attempts. Scores come from the same fixed rules learners see, so treat them as a conversation starter, not a grade."));
    return h("div", {}, out);
  }

  function resetForNext() {
    if (!window.confirm("Clear every lab's progress on this device? Make sure the learner has copied their progress code first.")) return;
    const ws = store.state.workshop;
    store.reset();
    store.setWorkshop(ws);
    showNotice("Progress cleared. Ready for the next learner.");
    route();
  }

  // ---------- dialogs ----------
  function openProgress() {
    $("learner-name").value = store.state.learner;
    $("class-code").value = store.classCode(LABS.map((l) => l.id));
    $("persist-line").textContent = store.persistent
      ? "Your progress saves automatically in this browser on this device."
      : "This browser is not allowing saves, so progress lasts only until you close the page. Download a progress file to keep it.";
    $("import-msg").textContent = "";
    $("dlg-progress").showModal();
  }

  function wireDialogs() {
    $("limits-list").replaceChildren(...S.EVALUATION_LIMITS.map((t) => h("li", {}, t)));
    document.querySelectorAll("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
    $("open-limits").addEventListener("click", () => $("dlg-limits").showModal());
    $("open-progress").addEventListener("click", openProgress);
    $("toggle-workshop").addEventListener("click", () => {
      const on = !store.state.workshop;
      store.setWorkshop(on);
      if (!on && location.hash === "#/workshop") go("#/"); else route();
    });
    $("learner-name").addEventListener("change", (e) => {
      store.setLearner(e.target.value);
      $("class-code").value = store.classCode(LABS.map((l) => l.id));
    });
    $("copy-code").addEventListener("click", async () => {
      const btn = $("copy-code");
      try { await navigator.clipboard.writeText($("class-code").value); btn.textContent = "Copied"; }
      catch (e) { $("class-code").select(); btn.textContent = "Press Ctrl+C or Cmd+C"; }
      setTimeout(() => (btn.textContent = "Copy code"), 1800);
    });
    $("export-file").addEventListener("click", () => {
      const blob = new Blob([store.exportJSON()], { type: "application/json" });
      const a = h("a", { href: URL.createObjectURL(blob), download: "ai-foundations-progress.json" });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
    $("import-file").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const msg = $("import-msg");
      try {
        const { added, notice } = store.importJSON(await file.text());
        msg.textContent = added ? "Imported " + added + " attempt" + (added === 1 ? "" : "s") + "." : "Nothing new in that file; you already had all of it.";
        msg.style.color = "var(--green)";
        if (notice) showNotice(notice);
        route();
      } catch (err) {
        msg.textContent = err.message;
        msg.style.color = "var(--red)";
      }
      e.target.value = "";
    });
    $("reset-all").addEventListener("click", () => {
      if (!window.confirm("Clear all your progress on this device? This cannot be undone. Download a progress file first if you want a copy.")) return;
      store.reset();
      $("dlg-progress").close();
      showNotice("All progress cleared.");
      go("#/");
    });
  }

  // ---------- routing ----------
  function go(hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  }

  function route() {
    flushDraft(); // leaving the page within the autosave delay must not lose the last keystrokes
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    let active = null;
    if (parts[0] === "lab" && labById(parts[1])) {
      const lab = labById(parts[1]);
      active = lab.id;
      renderLab(lab, ["learn", "try", "feedback"].includes(parts[2]) ? parts[2] : "learn");
    } else if (parts[0] === "done") renderDone();
    else if (parts[0] === "workshop") renderWorkshop();
    else renderHome();
    renderNav(active);
    if (route.started) view.focus({ preventScroll: true });
    route.started = true;
    window.scrollTo(0, 0);
  }

  // Workshop mode can be switched on with a link: studio/?workshop=1
  const params = new URLSearchParams(location.search);
  const startNotice = store.load();
  if (params.get("workshop") === "1" && !store.state.workshop) store.setWorkshop(true);
  wireDialogs();
  window.addEventListener("hashchange", route);
  route();
  if (startNotice) showNotice(startNotice);
})();
