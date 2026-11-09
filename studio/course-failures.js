// AI Foundations Studio: the second beginner course, about understanding AI failures.
// Pure data. Every prompt, reply, book, quote, and notice here was written by hand for the lesson.
// Nothing is generated live, and the made-up items are labeled as made up in their explanations.
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  // The five ways a reply goes wrong that this course teaches. Diagnose labs pick from this list.
  const FAILURE_CAUSES = [
    { id: "invented", label: "Made something up", hint: "States a fact, book, quote, or source that is not real." },
    { id: "ignored", label: "Ignored what you asked", hint: "Skips a limit or instruction you gave it." },
    { id: "vague", label: "The request was too vague", hint: "Generic because the prompt gave it nothing to work with." },
    { id: "outdated", label: "May be out of date", hint: "Presents rules, prices, or schedules that change as fixed and current." },
    { id: "agreed", label: "Told you what you wanted to hear", hint: "Went along with a wrong idea built into the question." }
  ];

  const FAILURES_COURSE = {
    id: "when-ai-gets-it-wrong",
    version: 1,
    title: "When AI Gets It Wrong",
    summary:
      "Five short labs on what to do when a reply misses. Learn to name the kind of mistake, fix the request behind it, ask how sure it is, check a summary against the original, and push back without being pushed around. About 40 minutes in total.",
    recommendedAfter: "first-prompts",
    labs: [
      {
        id: "name-the-failure",
        title: "Name the failure",
        minutes: 9,
        type: "diagnose",
        passScore: 67,
        learn: {
          idea: "Most bad replies fail in one of five ways. Naming which one tells you how to fix it.",
          body: [
            "When a reply is wrong, it is tempting to give up or to type \"try again\". It works better to ask what kind of wrong it is, because each kind has a different fix.",
            "The five common kinds: it made something up, it ignored part of what you asked, your request was too vague to answer well, the answer may be out of date, or it agreed with a mistaken idea in your question."
          ],
          compare: [
            {
              label: "Just try again",
              prompt: "That's wrong. Try again.",
              reply: "I apologize for the confusion. Here is another version...",
              verdict: "weak",
              why: "It does not know what was wrong, so the next reply can repeat the same mistake in new words."
            },
            {
              label: "Name what went wrong",
              prompt: "You ignored my limit. I said a small backpack only, and you listed a suitcase and a cooler. Redo the list so it all fits in a 20 liter backpack.",
              reply: "Got it. Here is a list that fits a 20 liter backpack: two shirts, one pair of shorts, a swimsuit, sandals...",
              verdict: "strong",
              why: "Naming the failure (ignored the limit) points it straight at the fix."
            }
          ]
        },
        attempt: {
          scenario: "Here are six replies that went wrong. Each one was written for this exercise. For each, pick the main reason it failed.",
          instruction: "Pick the main cause for every reply. Some could fit two causes; choose the one that best explains the problem.",
          causes: FAILURE_CAUSES,
          cases: [
            { id: "c1", prompt: "Give me a three-day packing list for a beach trip. I can only bring a small backpack.",
              reply: "Here is your list: a large suitcase, a beach umbrella, a folding chair, a cooler, six pairs of shoes, and four outfits per day.",
              cause: "ignored",
              explain: "You said small backpack. It packed a suitcase and a cooler. The fix: repeat the limit and ask it to stick to it." },
            { id: "c2", prompt: "Recommend a good book about sleep.",
              reply: "Try The Quiet Hours by Dr. Helen Marsh (2017), a bestselling guide based on her university sleep research.",
              cause: "invented",
              explain: "This book and author were made up for this exercise, to show that an invented book reads exactly like a real one. The fix: look the title up before you buy or cite it." },
            { id: "c3", prompt: "Write something for the newsletter.",
              reply: "Welcome to this month's newsletter. We have lots of exciting updates to share with you. Stay tuned for more.",
              cause: "vague",
              explain: "It had no topic, reader, or length to aim at, so it wrote filler. The fix: say what the newsletter is about, who reads it, and what this piece should say." },
            { id: "c4", prompt: "What is the fee to renew a passport?",
              reply: "The renewal fee is exactly $110, and it has been that way for years.",
              cause: "outdated",
              explain: "Fees change, and the AI may be repeating an old number with full confidence. The fix: check the official government site for today's fee." },
            { id: "c5", prompt: "Since cracking your knuckles causes arthritis, how can I stop?",
              reply: "Great question. Because knuckle cracking leads to arthritis, here are five ways to break the habit.",
              cause: "agreed",
              explain: "The question assumed a link that research has not shown, and the reply simply went along with it. The fix: ask \"Is it true that...\" before asking how." },
            { id: "c6", prompt: "Find me a quote from Abraham Lincoln about the internet.",
              reply: "Lincoln once said, \"The internet will connect a divided nation.\"",
              cause: "invented",
              explain: "Lincoln died long before the internet existed. The quote was made up for this exercise, and an AI can invent quotes just like it. The fix: be suspicious of any quote that sounds too perfect, and look it up." }
          ]
        },
        checks: [
          { id: "diagnosis", label: "Names the main cause for each reply", type: "diagnosis", weight: 3,
            tip: "Look at what the prompt asked for, then at what came back. Was something added, skipped, assumed, or just generic?",
            note: "You can tell the kinds of failure apart. That is most of the skill." }
        ],
        facilitator: {
          minutes: 9,
          setup: "Put the five causes on the board first. Have pairs sort the six replies together before anyone submits.",
          discuss: ["Which reply could fit two causes? Which one did you pick, and why?", "Which kind of failure have you run into most often?"],
          watchFor: "Learners who label everything \"made something up\". Ask them to point to the exact part of the reply that is wrong."
        }
      },
      {
        id: "fix-the-generic",
        title: "Fix the request behind a generic answer",
        minutes: 8,
        type: "prompt",
        passScore: 75,
        learn: {
          idea: "A generic answer is usually a generic question. Fix the request, not the reply.",
          body: [
            "When the AI gives you an answer that would suit anyone, it is often because the request could have come from anyone. It had to guess, so it guessed the average.",
            "The fix is to add what makes your situation yours: who it is for, the limits you are working with, and what you have already ruled out."
          ],
          compare: [
            {
              label: "Generic",
              prompt: "Give me some exercise ideas.",
              reply: "1. Running 2. Swimming 3. Cycling 4. Yoga 5. Weight training.",
              verdict: "weak",
              why: "A list anyone could have written. Nothing fits your knees, schedule, or space."
            },
            {
              label: "Yours",
              prompt: "Give me five exercise ideas I can do at home in 15 minutes, with no equipment. I have a sore knee, so nothing with jumping.",
              reply: "1. Wall push-ups 2. Seated leg raises 3. Glute bridges 4. Standing calf raises holding a chair 5. Gentle stretching routine...",
              verdict: "strong",
              why: "Time, place, equipment, and the knee all shaped the answer."
            }
          ]
        },
        attempt: {
          scenario: "You typed \"Give me some dinner ideas.\" and got: \"1. Pasta 2. Stir fry 3. Tacos 4. Soup 5. Salad.\" Here is what you did not say: you are cooking for two on weeknights, you have about 30 minutes, your partner does not eat dairy, and you are tired of pasta.",
          instruction: "Rewrite the request so the answer fits your real situation.",
          starter: "Give me some dinner ideas.",
          placeholder: ""
        },
        checks: [
          { id: "rewritten", label: "Really rewrites the request", type: "differsFrom", text: "Give me some dinner ideas.", min: 0.5, weight: 1,
            tip: "Adding one word is not a rewrite. Start over and include your situation.",
            note: "This is a new request, not a tweak." },
          { id: "who", label: "Says who it is for", type: "anyOf", terms: ["two", "2 people", "couple", "partner", "family", "kids", "husband", "wife", "roommate", "people"], weight: 1,
            tip: "Say who is eating: cooking for two is different from cooking for six.",
            note: "It knows who it is cooking for." },
          { id: "time", label: "Gives a time limit", type: "anyOf", terms: ["minute*", "min", "quick", "fast", "weeknight*", "hour", "time"], weight: 1,
            tip: "Say how much time you have, like \"30 minutes on a weeknight\".",
            note: "It knows how much time you have." },
          { id: "diet", label: "Mentions the diet need", type: "anyOf", terms: ["dairy", "lactose", "milk", "cheese", "vegan", "allerg*", "can't eat", "cannot eat", "doesn't eat", "does not eat", "don't eat"], weight: 2,
            tip: "The dairy limit is the detail most likely to ruin a suggestion. Say it.",
            note: "It knows about the dairy limit." },
          { id: "avoid", label: "Says what to skip", type: "anyOf", terms: ["no pasta", "not pasta", "without pasta", "tired of", "bored of", "besides", "other than", "except", "avoid", "something new", "different", "skip"], weight: 1,
            tip: "Tell it what you have ruled out, so it does not suggest pasta first.",
            note: "It knows what you are tired of." }
        ],
        facilitator: {
          minutes: 8,
          setup: "Read the generic list aloud and ask the room why it is not useful. Then let them rewrite.",
          discuss: ["Which missing detail changed the answer the most?", "What details do you usually leave out because they feel obvious to you?"],
          watchFor: "Learners who add every detail in one long sentence. That is fine; the habit is including them at all."
        }
      },
      {
        id: "ask-how-sure",
        title: "Ask how sure it is",
        minutes: 7,
        type: "prompt",
        passScore: 75,
        learn: {
          idea: "For facts that change or matter, ask how sure it is and where you can check.",
          body: [
            "An AI tool states guesses and facts in the same calm voice. It also may not know about changes since it was trained, unless it can look things up.",
            "You can ask it to show its uncertainty. Ask how confident it is, what might have changed, and where you can confirm it. That does not make it right, but it shows you what to check."
          ],
          compare: [
            {
              label: "Just the question",
              prompt: "Can I bring my dog on the train?",
              reply: "Yes, dogs are allowed on trains as long as they are on a leash.",
              verdict: "weak",
              why: "One confident answer. It does not say which train company, whether rules differ, or how to check."
            },
            {
              label: "Asks how sure",
              prompt: "Can I bring a medium-sized dog on a regional train in my state? Tell me how sure you are, what might have changed, and where I can check the current rules.",
              reply: "Rules vary by train company, and I may not have the latest policy. Many allow small pets in carriers. For a medium dog, check the company's pet policy page or call them before you travel.",
              verdict: "strong",
              why: "It shows what it is unsure about and points you to the place that knows."
            }
          ]
        },
        attempt: {
          scenario: "You are flying to visit family next month and want to know how much liquid you can pack in your carry-on bag. Rules can differ by country and can change over time.",
          instruction: "Write a question that gets a useful answer and makes it easy for you to check.",
          starter: "",
          placeholder: "e.g. How much liquid can I..."
        },
        checks: [
          { id: "topic", label: "Asks the actual question", type: "allOf", groups: [["liquid*", "fluid*", "toiletr*", "shampoo", "bottle*"], ["carry-on", "carry on", "cabin", "hand luggage", "bag", "bags", "flight", "fly*", "airport", "plane"]], weight: 1,
            tip: "Make sure the question itself is there: liquids in a carry-on bag.",
            note: "The question is clear." },
          { id: "sure", label: "Asks how sure it is", type: "anyOf", terms: ["how sure", "how confident", "confiden*", "certain*", "uncertain*", "not sure", "unsure", "don't know", "do not know"], weight: 2,
            tip: "Ask it how sure it is, or to say when it does not know.",
            note: "You asked it to show its uncertainty." },
          { id: "source", label: "Asks where to check", type: "anyOf", terms: ["source*", "official", "where can i check", "where to check", "where i can check", "link*", "website", "verify", "confirm", "check"], weight: 2,
            tip: "Ask where you can confirm it, like the official airport security site.",
            note: "You asked where to confirm it." },
          { id: "current", label: "Raises that rules change", type: "anyOf", terms: ["current*", "latest", "up to date", "up-to-date", "changed", "change*", "as of", "today", "this year", "outdated", "out of date", "recent*", "still"], weight: 1,
            tip: "Mention that rules change, and ask whether its answer could be out of date.",
            note: "You flagged that the rules may have changed." },
          { id: "where", label: "Says where you are flying", type: "anyOf", terms: ["country", "countries", "airline", "domestic", "international", "flying from", "flying to", "fly from", "fly to", "flight to", "flight from", "trip to", "from the us", "from the uk", "within"], weight: 1,
            tip: "Say where you are flying from and to, since rules differ by country.",
            note: "It knows which rules apply." }
        ],
        facilitator: {
          minutes: 7,
          setup: "Ask the room for a fact they looked up recently that turned out to have changed.",
          discuss: ["Did asking how sure it is change the answer, or only the tone?", "Which kinds of questions always deserve a check?"],
          watchFor: "Learners who think a confident answer is a checked answer. Asking for confidence shows what to check; it is not the check."
        }
      },
      {
        id: "check-the-summary",
        title: "Check a summary against the original",
        minutes: 8,
        type: "flag",
        passScore: 67,
        learn: {
          idea: "When AI summarizes something, compare it with the original. Summaries can drop limits, add details, and change who to contact.",
          body: [
            "Summaries are one of the most useful things AI does, and one of the easiest to trust too much. The summary sounds like the original, so it feels checked.",
            "The habit: for anything you will act on, put the summary next to the original and check the details that matter: dates, who it applies to, amounts, and who to contact."
          ],
          compare: [
            {
              label: "Trusted as is",
              prompt: "Summarize this school notice.",
              reply: "School is closed Friday for a teacher training day.",
              verdict: "weak",
              why: "The original said the after-school club still runs. That detail was dropped, and it mattered to you."
            },
            {
              label: "Checked against the notice",
              prompt: "Summarize this school notice, and list anything that is still happening that day.",
              reply: "School is closed Friday for teacher training. The after-school club still runs from 3 p.m.",
              verdict: "strong",
              why: "Asking for exceptions helps, and a quick look at the original confirms it."
            }
          ]
        },
        attempt: {
          scenario: "You asked an AI to summarize a notice from your building manager. The notice and every detail in it are made up for this exercise.",
          source: "Water will be shut off on Tuesday, March 10, from 9 a.m. to 1 p.m. for pipe repairs on floors 3 to 6. Floors 1 and 2 are not affected. Please store some water in advance. The laundry room will reopen at 3 p.m. Questions go to the front desk.",
          instruction: "Tick every sentence in the summary that the notice does not support: anything changed, added, or wrong.",
          sentences: [
            { id: "s1", text: "Water is off on Tuesday, March 10, from 9 a.m. to 1 p.m.", suspect: false,
              explain: "Matches the notice." },
            { id: "s2", text: "The shutoff affects every floor in the building.", suspect: true,
              explain: "Changed. Only floors 3 to 6 are affected, and the notice says floors 1 and 2 are not." },
            { id: "s3", text: "It is for pipe repairs.", suspect: false,
              explain: "Matches the notice." },
            { id: "s4", text: "Residents should store some water beforehand.", suspect: false,
              explain: "Matches the notice." },
            { id: "s5", text: "Residents will get a rent credit for the inconvenience.", suspect: true,
              explain: "Added. The notice says nothing about a rent credit." },
            { id: "s6", text: "The laundry room reopens at 3 p.m.", suspect: false,
              explain: "Matches the notice." },
            { id: "s7", text: "Send questions by email to the building manager.", suspect: true,
              explain: "Changed. The notice says questions go to the front desk." }
          ]
        },
        checks: [
          { id: "flags", label: "Flags what the notice does not support", type: "flags", weight: 3,
            tip: "Read the notice and the summary side by side. Check who it applies to, anything extra, and who to contact.",
            note: "You caught every change and addition." }
        ],
        facilitator: {
          minutes: 8,
          setup: "Have learners read the original notice first, cover it, read the summary, then uncover and compare.",
          discuss: ["Which error would have cost you the most?", "What would you add to your request to make the summary safer?"],
          watchFor: "The rent credit is the easiest to miss because it is good news. Point out that pleasant additions still need checking."
        }
      },
      {
        id: "push-back-well",
        title: "Push back without being pushed around",
        minutes: 8,
        type: "choice",
        passScore: 75,
        learn: {
          idea: "AI tools often change their answer just because you questioned it. Ask for the evidence instead of asking \"are you sure?\".",
          body: [
            "Many AI tools are built to be agreeable. When you push back, they often apologize and switch sides, even when their first answer was right.",
            "So a changed answer is not a checked answer. When two answers disagree, ask it to lay out the facts behind each one, then check the deciding fact yourself."
          ],
          compare: [
            {
              label: "\"Are you sure?\"",
              prompt: "Are you sure? I thought it was the other way around.",
              reply: "You are right, I apologize for the error. It is the other way around.",
              verdict: "weak",
              why: "It flipped because you pushed, not because of any new fact. You still do not know which answer is right."
            },
            {
              label: "Ask for the evidence",
              prompt: "You said one thing, and I have heard the opposite. Lay out the evidence for each side, say how sure you are about each, and tell me what source would settle it.",
              reply: "Here is what supports each view... I am fairly sure about the first point but not the second. The official guidance page would settle it.",
              verdict: "strong",
              why: "Now you have facts to check instead of two confident opinions."
            }
          ]
        },
        attempt: {
          scenario: "You asked whether your laptop from 2019 can run a new photo app. The AI said yes. You replied, \"Are you sure? I read it needs a newer chip.\" It instantly answered, \"You are right, I apologize. It cannot run it.\" Now you have two confident, opposite answers.",
          instruction: "Pick the best next step, then say why in a sentence.",
          options: [
            { id: "A", text: "Go with the second answer. It corrected itself, so it must be right now.",
              feedback: "The second answer is not more reliable. It may have flipped only because you pushed back." },
            { id: "B", text: "Keep asking \"Are you sure?\" until it stops changing its answer.",
              feedback: "It may keep flipping, or settle on whatever you seem to want. Neither tells you the truth." },
            { id: "C", text: "Ask it to list the app's requirements and your laptop's specs side by side and say how sure it is of each, then check the app's official requirements page.",
              feedback: "Yes. You turn two opinions into facts you can compare, and you check the deciding fact at the source." }
          ],
          whyPlaceholder: "I picked this one because..."
        },
        checks: [
          { id: "pick", label: "Picks the strongest next step", type: "choice", correct: "C", weight: 2,
            tip: "Ask yourself which option would tell you what is actually true, not just what the AI says now.",
            note: "You picked the step that gets you to the facts." },
          { id: "why-flip", label: "Explanation notices it flipped to agree", type: "anyOf", field: "why", terms: ["agree*", "flip*", "changed", "change*", "pleas*", "push*", "want to hear", "went along", "apolog*", "caved", "contradict*", "opposite", "both"], weight: 1,
            tip: "Mention why the second answer is not trustworthy: it changed just because you questioned it.",
            note: "You saw that the flip was not evidence." },
          { id: "why-evidence", label: "Explanation mentions checking the facts", type: "anyOf", field: "why", terms: ["requirement*", "spec*", "evidence", "side by side", "compare*", "fact*", "detail*", "official", "source", "check*", "verify", "confirm"], weight: 1,
            tip: "Mention what C does: it compares the actual requirements and checks the official page.",
            note: "You named the real check." }
        ],
        facilitator: {
          minutes: 8,
          setup: "Before revealing anything, ask: when the AI changed its answer, did that make it more or less trustworthy?",
          discuss: ["Has an AI ever agreed with you when you were wrong?", "What is the one fact that would settle the laptop question?"],
          watchFor: "Learners who pick A because \"it admitted the mistake\". Talk about agreeable tools and why an apology is not evidence."
        }
      }
    ]
  };

  return { FAILURES_COURSE, FAILURE_CAUSES };
});
