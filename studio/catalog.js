// AI Foundations Studio: the course catalog.
// Lists every course in order and answers "which course holds this lab?". Lab ids are unique across
// courses, so saved progress (keyed by lab id) needs no change when a course is added.
(function (root, factory) {
  const deps = typeof module !== "undefined" && module.exports
    ? Object.assign({}, require("./course.js"), require("./course-failures.js"))
    : root.AFStudio;
  const api = factory(deps);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function (deps) {
  const COURSES = [deps.COURSE, deps.FAILURES_COURSE];

  function courseById(id) {
    return COURSES.find((c) => c.id === id) || null;
  }

  function courseOfLab(labId) {
    return COURSES.find((c) => c.labs.some((l) => l.id === labId)) || null;
  }

  function findLab(labId) {
    for (const c of COURSES) {
      const lab = c.labs.find((l) => l.id === labId);
      if (lab) return lab;
    }
    return null;
  }

  function allLabIds() {
    return COURSES.flatMap((c) => c.labs.map((l) => l.id));
  }

  return { COURSES, courseById, courseOfLab, findLab, allLabIds };
});
