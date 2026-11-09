# AI Foundations Studio

Six short, guided labs for AI beginners. Each lab runs the same loop: **learn** one habit (with a weak and a strong example side by side), **try** it yourself, get instant **feedback** on what worked and what to fix, then **revise** as many times as you like. Progress saves in the browser as you go.

Open `studio/index.html` through any static server, or visit the published page at `/ai-foundations/studio/`. No sign-up, no install, no AI model calls, and nothing typed leaves the device.

## The course: Your First Prompts (about 45 minutes)

| # | Lab | Exercise type | What it teaches |
|---|-----|---------------|-----------------|
| 1 | Say what you actually want | Write a prompt | Problem, outcome, deadline, tone |
| 2 | Say who it is for and how it should look | Write a prompt | Reader and format |
| 3 | Compare three approaches | Pick and explain | Letting the AI ask questions first |
| 4 | Spot what needs checking | Flag sentences | Verifying facts and made-up statistics |
| 5 | Keep private details out | Edit a request | Removing personal details without losing the ask |
| 6 | Talk back to fix a bad reply | Write a follow-up | Specific revision requests |

All course content lives in `course.js` as plain data: lesson text, comparisons, the exercise, the rule checks, and facilitator notes.

## How the feedback works, and its limits

Feedback is deterministic and rule-based (`grader.js`). Each lab has a short list of checks such as "mentions a deadline", "no email address left", or "picked option C". Each check has a weight, a tip shown when it is missed, and a note shown when it is met. The score is the weighted share of checks met, and each lab has a pass mark.

What this means in practice, and what learners see in the "How the feedback works" dialog:

- The rules look for words, word counts, and patterns. They check for the habit the lab teaches. They do not judge writing quality.
- A thoughtful prompt can miss a check by using words the rule does not expect. A prompt stuffed with the right words can pass without being useful.
- The same input always gets the same result, which is what makes "Up 25 points, newly passing: Gives a deadline" possible after a retry.
- The sample replies in each lesson are hand-written to make a point. Real tools will reply differently.

To make a rule smarter, add terms to its `terms` list in `course.js` and add a sample attempt to `test/fixtures.js` that proves it.

## Saved progress and recovery (`progress.js`)

- Saved in `localStorage` under `af-studio-v1`, with a schema version. Every attempt keeps its input, score, and which checks were met or missed (last 20 per lab). Unsent drafts autosave.
- **Damaged data:** if the saved data cannot be parsed or has an unknown version, it is copied to `af-studio-v1-damaged-<timestamp>`, the Studio starts fresh, and the learner sees a notice.
- **Blocked storage** (some private windows): the Studio runs from memory and tells the learner to download a progress file.
- **Full storage:** older attempts are trimmed to the last three per lab instead of losing the save.
- **Move browsers:** "Save or move my progress" downloads a JSON file with every attempt; importing it elsewhere merges attempts without duplicates.

## Workshop mode

Turn it on with the Workshop mode button or the link `studio/?workshop=1`.

- Every lab shows facilitator notes: set-up, discussion questions, what to watch for, and timing.
- The workshop board shows a timed agenda (about 55 minutes), a per-lab countdown timer, and a **class board**.
- Learners copy their **progress code** (starts with `AF1.`) from "Save or move my progress". The code holds scores, attempt counts, and missed check IDs only, never what they typed. Paste the codes, one per line, and the board shows each learner's results, per-lab pass rates, the most-missed check per lab, and the lab where group time would help most. Damaged codes are listed without breaking the board.
- "Load a demo class" fills the board with five synthetic learners (`demo-class.js`).
- "Clear progress for the next learner" resets a shared computer.

## Files

| File | Role |
|------|------|
| `index.html`, `studio.css` | Page shell and styles (Mick Cairn house look, self-hosted fonts) |
| `course.js` | Course data and the evaluation-limits text |
| `grader.js` | Deterministic grading and attempt comparison |
| `progress.js` | Persistence, recovery, export, import, progress codes |
| `workshop.js` | Agenda and class board aggregation |
| `demo-class.js` | Synthetic demo class |
| `app.js` | Browser UI wiring |

## Tests

```sh
cd studio
npm test        # 33 unit tests: course integrity and house style, grading, persistence, workshop board
npm run e2e     # 15 browser checks in Chromium via Playwright; SHOTS=/some/dir saves screenshots
```

The e2e script starts its own static server, walks a full learn, fail, revise, pass loop, checks reload persistence, draft autosave, every exercise type, export and re-import, workshop board with the demo class, damaged-data recovery, phone width overflow, and that the page makes no network requests and logs no errors. It needs Playwright and Chromium available to `require("playwright")`.
