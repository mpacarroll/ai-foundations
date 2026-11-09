// AI Foundations Studio: workshop (instructor) mode logic.
// Builds the session agenda and the class board from learners' progress codes. Pure functions.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  function buildAgenda(course, startMinutes) {
    let t = startMinutes || 0;
    const items = [{ at: t, minutes: 5, title: "Welcome, and how the feedback works" }];
    t += 5;
    for (const lab of course.labs) {
      const m = (lab.facilitator && lab.facilitator.minutes) || lab.minutes || 5;
      items.push({ at: t, minutes: m, title: lab.title, labId: lab.id });
      t += m;
    }
    items.push({ at: t, minutes: 5, title: "Wrap up: collect progress codes, questions" });
    t += 5;
    return { items, totalMinutes: t - (startMinutes || 0) };
  }

  function formatClock(totalMinutes) {
    const m = Math.max(0, Math.round(totalMinutes));
    return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
  }

  // Parses pasted codes (one per line, or separated by spaces). Bad lines are reported, not fatal.
  function parseCodes(text, decode) {
    const parts = String(text || "").split(/\s+/).map((s) => s.trim()).filter(Boolean);
    const learners = [], errors = [];
    parts.forEach((p, i) => {
      try {
        learners.push(decode(p));
      } catch (e) {
        errors.push({ index: i + 1, message: e.message });
      }
    });
    return { learners, errors };
  }

  function aggregateClass(course, learners) {
    const labs = course.labs.map((lab) => {
      let tried = 0, passed = 0, bestSum = 0;
      const missCounts = new Map();
      for (const l of learners) {
        const r = l.labs[lab.id];
        if (!r || !r.attempts) continue;
        tried++;
        if (r.passed) passed++;
        bestSum += r.best;
        for (const m of r.missed) missCounts.set(m, (missCounts.get(m) || 0) + 1);
      }
      let topMiss = null;
      for (const check of lab.checks) {
        const n = missCounts.get(check.id) || 0;
        if (n && (!topMiss || n > topMiss.count)) topMiss = { checkId: check.id, label: check.label, count: n };
      }
      return {
        labId: lab.id,
        title: lab.title,
        tried,
        passed,
        averageBest: tried ? Math.round(bestSum / tried) : null,
        topMiss
      };
    });
    const rows = learners.map((l) => ({
      name: l.name,
      passedCount: course.labs.filter((lab) => l.labs[lab.id] && l.labs[lab.id].passed).length,
      cells: course.labs.map((lab) => {
        const r = l.labs[lab.id];
        return r && r.attempts ? { best: r.best, attempts: r.attempts, passed: r.passed } : null;
      })
    }));
    // The lab where the most learners who tried it have not yet passed: where to spend group time.
    let focus = null;
    for (const s of labs) {
      const stuck = s.tried - s.passed;
      if (stuck > 0 && (!focus || stuck > focus.stuck)) focus = { labId: s.labId, title: s.title, stuck, topMiss: s.topMiss };
    }
    return { learnerCount: learners.length, labs, rows, focus };
  }

  return { buildAgenda, formatClock, parseCodes, aggregateClass };
});
