// AI Foundations Studio: a synthetic demo class for trying workshop mode.
// Every name and result here is invented. The app turns these into real progress codes
// so the demo goes through the same decode path as codes pasted by actual learners.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  const DEMO_CLASS = [
    { n: "Avery (demo)", labs: {
      "say-what-you-want": { b: 100, a: 2, p: 1, m: [] },
      "who-its-for": { b: 88, a: 1, p: 1, m: ["plain"] },
      "let-it-ask": { b: 100, a: 1, p: 1, m: [] },
      "check-the-facts": { b: 83, a: 2, p: 1, m: [] },
      "keep-it-private": { b: 100, a: 2, p: 1, m: [] },
      "fix-the-reply": { b: 83, a: 1, p: 1, m: ["tone"] } } },
    { n: "Blake (demo)", labs: {
      "say-what-you-want": { b: 88, a: 3, p: 1, m: ["tone"] },
      "who-its-for": { b: 63, a: 2, p: 0, m: ["shape", "plain"] },
      "let-it-ask": { b: 75, a: 2, p: 1, m: ["why-detail"] },
      "check-the-facts": { b: 50, a: 1, p: 0, m: ["flags"] } } },
    { n: "Casey (demo)", labs: {
      "say-what-you-want": { b: 75, a: 1, p: 1, m: ["deadline", "tone"] },
      "who-its-for": { b: 88, a: 2, p: 1, m: ["plain"] },
      "let-it-ask": { b: 50, a: 1, p: 0, m: ["pick", "why-ask"] } } },
    { n: "Devon (demo)", labs: {
      "say-what-you-want": { b: 100, a: 1, p: 1, m: [] },
      "who-its-for": { b: 100, a: 1, p: 1, m: [] },
      "let-it-ask": { b: 100, a: 1, p: 1, m: [] },
      "check-the-facts": { b: 67, a: 3, p: 1, m: ["flags"] },
      "keep-it-private": { b: 67, a: 2, p: 0, m: ["names", "id"] } } },
    { n: "Emerson (demo)", labs: {
      "say-what-you-want": { b: 63, a: 2, p: 0, m: ["deadline", "tone", "length"] } } }
  ];
  return { DEMO_CLASS };
});
