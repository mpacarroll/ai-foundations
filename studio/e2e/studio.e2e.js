// End-to-end check of the Studio in a real browser (Playwright + Chromium).
// Run from the studio folder: npm run e2e   (optional: SHOTS=/some/dir to save screenshots)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const SHOTS = process.env.SHOTS || "";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json" };

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true });
}

const steps = [];
async function step(name, fn) {
  try { await fn(); steps.push(["ok", name]); console.log("ok - " + name); }
  catch (e) { steps.push(["fail", name]); console.log("not ok - " + name + "\n  " + e.message.split("\n")[0]); }
}

(async () => {
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/studio/";
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: SHOTS ? 2 : 1, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("dialog", (d) => d.accept());
  const external = [];
  page.on("request", (r) => { if (!r.url().startsWith("http://127.0.0.1") && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });

  await step("overview loads with six labs and a start button", async () => {
    await page.goto(base);
    assert.strictEqual(await page.locator("#labnav li").count(), 6);
    await page.getByRole("link", { name: "Start the first lab" }).waitFor();
    await shot(page, "01-overview");
  });

  await step("learn step shows a weak and a strong comparison", async () => {
    await page.getByRole("link", { name: "Start the first lab" }).click();
    await page.locator(".cmp.weak").waitFor();
    assert.strictEqual(await page.locator(".cmp").count(), 2);
    assert.doesNotMatch(await page.locator("#view").innerText(), /\bnull\b|undefined/);
    await shot(page, "02-learn");
  });

  await step("a vague attempt gets specific feedback and does not pass", async () => {
    await page.getByRole("link", { name: "Try it yourself" }).click();
    const ta = page.locator("#attempt");
    assert.strictEqual(await ta.inputValue(), "Write an email to my landlord.");
    await ta.fill("Write a polite email to my landlord about the dripping faucet.");
    await page.locator("#check").click();
    await page.getByTestId("verdict").waitFor();
    assert.match(await page.getByTestId("verdict").textContent(), /Not yet/);
    assert.ok(await page.locator(".checks li.miss").count() >= 1);
    await shot(page, "03-feedback-fail");
  });

  await step("revising keeps the last text, passes, and reports the improvement", async () => {
    await page.getByRole("link", { name: "Revise and try again" }).click();
    const ta = page.locator("#attempt");
    assert.match(await ta.inputValue(), /dripping faucet/);
    await ta.fill("Write a short, polite email to my landlord. The kitchen faucet has been dripping for a week and I would like them to send a plumber to fix it by Friday.");
    await page.locator("#check").click();
    await page.getByTestId("delta").waitFor();
    assert.match(await page.getByTestId("verdict").textContent(), /Passed/);
    assert.match(await page.getByTestId("delta").textContent(), /Up \d+ points/);
    assert.match(await page.locator("#progress-label").textContent(), /1 of 6/);
    await shot(page, "04-feedback-pass");
  });

  await step("drafts autosave and progress survives a reload", async () => {
    await page.goto(base + "#/lab/who-its-for/try");
    await page.locator("#attempt").fill("Explain password managers to my uncle");
    await page.waitForTimeout(700);
    await page.reload();
    await page.locator("#attempt").waitFor();
    assert.strictEqual(await page.locator("#attempt").inputValue(), "Explain password managers to my uncle");
    assert.match(await page.locator("#progress-label").textContent(), /1 of 6/);
    assert.strictEqual(await page.locator('#labnav a[data-status="passed"]').count(), 1);
  });

  await step("a draft typed just before leaving the page is kept", async () => {
    await page.locator("#attempt").fill("Explain password managers to my uncle, quickly");
    await page.goto(base + "#/lab/who-its-for/learn"); // well inside the 400 ms autosave delay
    await page.goto(base + "#/lab/who-its-for/try");
    assert.strictEqual(await page.locator("#attempt").inputValue(), "Explain password managers to my uncle, quickly");
  });

  await step("empty attempts are refused with a clear message", async () => {
    await page.locator("#attempt").fill("  ");
    await page.locator("#check").click();
    assert.match(await page.getByRole("alert").first().textContent(), /Type your attempt/);
  });

  await step("compare-approaches lab: picking and explaining", async () => {
    await page.goto(base + "#/lab/let-it-ask/try");
    await page.locator('input[value="C"]').check();
    await page.locator("#why").fill("It gives the budget and allergy details and lets it ask me questions first.");
    await page.locator("#check").click();
    await page.getByTestId("verdict").waitFor();
    assert.match(await page.getByTestId("verdict").textContent(), /Passed/);
    assert.ok((await page.locator("text=About each option").count()) === 1);
  });

  await step("fact-check lab: misses and extras are explained sentence by sentence", async () => {
    await page.goto(base + "#/lab/check-the-facts/try");
    await page.locator('input[value="s3"]').check();
    await page.locator('input[value="s2"]').check();
    await page.locator("#check").click();
    await page.locator(".sent").first().waitFor();
    assert.strictEqual(await page.locator(".sent .mark.bad").count(), 3); // two missed, one extra
    await shot(page, "05-fact-check");
  });

  await step("privacy lab: leftover details are listed", async () => {
    await page.goto(base + "#/lab/keep-it-private/try");
    await page.locator("#check").click();
    await page.getByTestId("verdict").waitFor();
    assert.ok(await page.locator("text=Still in your text").count() >= 1);
  });

  await step("progress dialog gives a class code and a download that re-imports", async () => {
    await page.locator("#open-progress").click();
    await page.locator("#learner-name").fill("Sam (test)");
    await page.locator("#learner-name").dispatchEvent("change");
    const code = await page.locator("#class-code").inputValue();
    assert.match(code, /^AF1\./);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#export-file").click()]);
    const file = await dl.path();
    await page.locator("#import-file").setInputFiles(file);
    await page.locator("#import-msg").filter({ hasText: /Nothing new/ }).waitFor();
    await shot(page, "06-progress-dialog");
    await page.locator("#dlg-progress [data-close]").last().click();
  });

  await step("workshop mode adds facilitator notes and a class board", async () => {
    await page.locator("#toggle-workshop").click();
    await page.goto(base + "#/lab/say-what-you-want/learn");
    await page.locator(".facil").waitFor();
    await page.goto(base + "#/workshop");
    await page.locator("#demo-class").click();
    await page.getByTestId("board-count").waitFor();
    assert.match(await page.getByTestId("board-count").textContent(), /5 learners/);
    assert.strictEqual(await page.locator('[data-testid="board-table"] tbody tr').count(), 5);
    await page.getByTestId("focus").waitFor();
    await shot(page, "07-workshop-board");
  });

  await step("the lab timer keeps ticking on screen after leaving and coming back", async () => {
    await page.getByRole("button", { name: "Start" }).click();
    await page.goto(base + "#/");
    await page.goto(base + "#/workshop");
    const a = await page.getByTestId("timer").textContent();
    await page.waitForTimeout(2200);
    const b = await page.getByTestId("timer").textContent();
    assert.notStrictEqual(a, b, "clock froze at " + a);
    await page.getByRole("button", { name: "Pause" }).click();
  });

  await step("a code pasted twice is counted once", async () => {
    const first = (await page.locator("#codes").inputValue()).split("\n")[0];
    await page.locator("#codes").fill((await page.locator("#codes").inputValue()) + "\n" + first);
    await page.locator("#build-board").click();
    assert.match(await page.getByTestId("board-count").textContent(), /5 learners/);
    assert.match(await page.getByTestId("dupes").textContent(), /counted once/);
  });

  await step("bad codes are reported without breaking the board", async () => {
    await page.locator("#codes").fill((await page.locator("#codes").inputValue()) + "\nnonsense");
    await page.locator("#build-board").click();
    assert.match(await page.locator("#board .notice").first().textContent(), /Code 7/); // line 6 is the duplicate from the step above
  });

  await step("damaged saved data is recovered with a notice", async () => {
    await page.evaluate(() => localStorage.setItem("af-studio-v1", "{broken"));
    await page.reload();
    assert.match(await page.locator("#notice").textContent(), /could not be read/);
    assert.match(await page.locator("#progress-label").textContent(), /0 of 6/);
  });

  await step("phone width: no horizontal scroll", async () => {
    const phone = await browser.newContext({ viewport: { width: 375, height: 800 }, deviceScaleFactor: SHOTS ? 2 : 1 });
    const p = await phone.newPage();
    await p.goto(base + "#/lab/who-its-for/learn");
    await p.locator(".cmp").first().waitFor();
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 0, "overflow " + over + "px");
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, "08-phone.png"), fullPage: true });
    await phone.close();
  });

  await step("no page errors and no network calls off this machine", async () => {
    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(external, []);
  });

  await browser.close();
  server.close();
  const failed = steps.filter((s) => s[0] === "fail").length;
  console.log(`\n# ${steps.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
