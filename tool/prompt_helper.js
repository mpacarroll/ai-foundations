// The whole tool's brain: turn plain answers into a well-structured prompt.
// Pure, dependency-free, shared by the HTML UI and the Node tests.

function buildPrompt(fields) {
  const f = fields || {};
  const task = (f.task || "").trim();
  if (!task) {
    throw new Error("A task is required — tell the AI what you want it to do.");
  }
  const lines = [];
  if ((f.role || "").trim()) {
    lines.push(`You are ${f.role.trim()}.`);
  }
  lines.push(`Your task: ${task}`);
  if ((f.audience || "").trim()) {
    lines.push(`Audience: ${f.audience.trim()}`);
  }
  if ((f.format || "").trim()) {
    lines.push(`Format the answer as: ${f.format.trim()}`);
  }
  const askFirst = f.askFirst !== false;
  if (askFirst) {
    lines.push(
      "If anything is unclear, ask me any questions you need before you start."
    );
  }
  return lines.join("\n");
}

// Works in Node (tests) and in the browser (UI) without a bundler.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildPrompt };
}
