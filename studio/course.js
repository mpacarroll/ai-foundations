// AI Foundations Studio: the beginner course.
// Pure data. Every "sample reply" here was written by hand for the lesson; nothing is generated live.
// Shared by the browser UI and the Node tests (no bundler needed).
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.AFStudio = Object.assign(root.AFStudio || {}, api);
})(typeof self !== "undefined" ? self : this, function () {
  const COURSE = {
    id: "first-prompts",
    version: 1,
    title: "Your First Prompts",
    summary:
      "Six short labs. Each one teaches one habit, lets you try it, checks your attempt, and lets you revise until it clicks. About 45 minutes in total.",
    labs: [
      {
        id: "say-what-you-want",
        title: "Say what you actually want",
        minutes: 6,
        type: "prompt",
        passScore: 75,
        learn: {
          idea: "A vague request gets a vague answer. Say what happened, what you want, and by when.",
          body: [
            "AI cannot see your situation. It only knows what you type. When a request is short and vague, it fills the gaps with guesses, and guesses are usually generic.",
            "The fix is not clever wording. It is the three things you would tell a helpful friend: what is going on, what you want to happen, and any deadline or tone that matters."
          ],
          compare: [
            {
              label: "Vague",
              prompt: "Write an email to my landlord.",
              reply: "Dear Landlord, I hope this message finds you well. I am writing to discuss a matter regarding my apartment. Please let me know a convenient time to talk. Best regards.",
              verdict: "weak",
              why: "It had nothing to go on, so it wrote a polite email that says nothing. You would have to rewrite all of it."
            },
            {
              label: "Specific",
              prompt: "Write a short, polite email to my landlord. The bathroom light has flickered for two weeks. I would like an electrician to look at it before next Monday.",
              reply: "Hi Sam, the bathroom light in my unit has been flickering for about two weeks. Could you arrange for an electrician to take a look before next Monday? I am home most evenings. Thanks for your help.",
              verdict: "strong",
              why: "It knew the problem, the ask, the deadline, and the tone. The draft is nearly ready to send."
            }
          ]
        },
        attempt: {
          scenario: "Your kitchen faucet has been dripping for a week. You want it fixed by Friday, and you want to stay on good terms with your landlord.",
          instruction: "Rewrite this vague request into one you would actually send to an AI: \"Write an email to my landlord.\"",
          starter: "Write an email to my landlord.",
          placeholder: "e.g. Write a short, friendly email to my landlord about..."
        },
        checks: [
          { id: "problem", label: "Names the problem", type: "anyOf", terms: ["faucet", "tap", "drip*", "leak*", "sink", "plumb*"], weight: 2,
            tip: "Say what is wrong. The AI does not know about the dripping faucet unless you tell it.",
            note: "You named the problem, so the email can be specific." },
          { id: "ask", label: "Says what you want to happen", type: "anyOf", terms: ["fix*", "repair*", "send someone", "plumber", "look at", "take care", "come out", "replace*"], weight: 2,
            tip: "Say the outcome you want, for example \"ask them to send a plumber\".",
            note: "You said what you want done." },
          { id: "deadline", label: "Gives a deadline", type: "anyOf", terms: ["friday", "by the end of the week", "this week", "monday", "tuesday", "wednesday", "thursday", "saturday", "sunday", "tomorrow", "asap", "soon as", "days"], weight: 1,
            tip: "Add the deadline (Friday). Without it, the AI will not mention timing.",
            note: "The deadline is in there." },
          { id: "tone", label: "Sets the tone", type: "anyOf", terms: ["polite*", "friendly", "kind*", "firm*", "calm*", "respectful*", "warm*", "courteous*", "professional*", "nice*", "good terms"], weight: 1,
            tip: "Say how it should sound, for example \"polite but clear\".",
            note: "You set the tone." },
          { id: "length", label: "Gives enough detail (15+ words)", type: "minWords", min: 15, weight: 1,
            tip: "Your request is still very short. A couple of full sentences is usually right.",
            note: "Enough detail for the AI to work with." },
          { id: "changed", label: "Actually rewrites the starter", type: "differsFrom", text: "Write an email to my landlord.", min: 0.4, weight: 1,
            tip: "This is still close to the vague version. Rewrite it in your own words with the details above.",
            note: "This is a real rewrite, not a small tweak." }
        ],
        facilitator: {
          minutes: 6,
          setup: "Read the vague prompt and its sample reply out loud. Ask the room what is missing before anyone types.",
          discuss: ["What did the vague reply guess about the situation?", "Which single detail changed the reply the most?"],
          watchFor: "People writing the email itself instead of the request to the AI. Both are fine; point out the difference."
        }
      },
      {
        id: "who-its-for",
        title: "Say who it is for and how it should look",
        minutes: 7,
        type: "prompt",
        passScore: 75,
        learn: {
          idea: "The same facts need different words for different people. Say who will read it and what shape you want.",
          body: [
            "\"Explain X\" gets you an explanation for nobody in particular. Usually that means too long and full of jargon.",
            "Add one line about the reader (their age, what they already know) and one line about the shape (a short list, three sentences, a text message). Those two lines do more than any magic phrase."
          ],
          compare: [
            {
              label: "No reader, no shape",
              prompt: "Explain two-factor authentication.",
              reply: "Two-factor authentication (2FA) is a security mechanism that requires two distinct forms of identification, typically combining something you know, such as a password, with something you have, such as a hardware token or an authenticator application generating time-based one-time passwords (TOTP)...",
              verdict: "weak",
              why: "Correct, but written for a security engineer. Your neighbor would stop reading at \"mechanism\"."
            },
            {
              label: "Reader and shape",
              prompt: "Explain two-factor authentication to my neighbor, who is 70 and only uses email. Use plain words and keep it to three short sentences.",
              reply: "It means logging in takes two steps instead of one. First you type your password, then the site texts a short code to your phone. Even if someone steals your password, they cannot get in without your phone.",
              verdict: "strong",
              why: "Same facts, sized and worded for the person who will actually read it."
            }
          ]
        },
        attempt: {
          scenario: "Your uncle keeps reusing one password everywhere. You want an explanation of what a password manager is that he will actually read.",
          instruction: "Write a prompt asking the AI to explain password managers to your uncle. Say who he is and how the answer should look.",
          starter: "",
          placeholder: "e.g. Explain what a password manager is to my uncle, who..."
        },
        checks: [
          { id: "topic", label: "Asks about password managers", type: "anyOf", terms: ["password manager*", "password app", "password vault", "password keeper"], weight: 1,
            tip: "Name the topic plainly: password managers.",
            note: "The topic is clear." },
          { id: "reader", label: "Describes the reader", type: "anyOf", terms: ["uncle", "he is", "he's", "he only", "he uses", "his", "years old", "retired", "not tech*", "non-tech*", "beginner", "new to", "never used"], weight: 2,
            tip: "Describe your uncle in a few words: age, what he already uses, how comfortable he is with tech.",
            note: "You described who will read it." },
          { id: "plain", label: "Asks for plain language", type: "anyOf", terms: ["plain", "simple", "no jargon", "without jargon", "everyday", "easy to understand", "non-technical", "avoid technical", "no technical"], weight: 1,
            tip: "Ask for plain words or no jargon. It defaults to technical terms otherwise.",
            note: "You asked for plain language." },
          { id: "shape", label: "Says how the answer should look", type: "anyOf", terms: ["bullet*", "list", "steps", "sentences", "sentence", "paragraph*", "short", "brief", "words", "text message", "email", "one page"], weight: 2,
            tip: "Say the shape: \"three short sentences\" or \"a short list of steps\".",
            note: "You set the length or format." },
          { id: "length", label: "Gives enough detail (12+ words)", type: "minWords", min: 12, weight: 1,
            tip: "Add a sentence about your uncle or the format you want.",
            note: "Enough detail to work with." }
        ],
        facilitator: {
          minutes: 7,
          setup: "Have two volunteers read the weak and strong sample replies aloud. Ask who in the room would actually read each one.",
          discuss: ["Who in your life would need a different version of this explanation?", "What format do you prefer when you are learning something new?"],
          watchFor: "Prompts that describe the reader but forget the shape, or the reverse. The feedback names which one is missing."
        }
      },
      {
        id: "let-it-ask",
        title: "Compare three approaches",
        minutes: 8,
        type: "choice",
        passScore: 75,
        learn: {
          idea: "You do not have to get everything into the first message. Asking the AI to ask you questions first is often the fastest route.",
          body: [
            "There are three common ways to start: a one-line request, a detailed request, or a detailed request that ends with \"ask me any questions you need first\".",
            "The third one lets the AI find what you forgot to mention before it writes anything. One short round of questions usually beats three rounds of fixing a wrong answer."
          ],
          compare: [
            {
              label: "One line",
              prompt: "Plan a birthday dinner.",
              reply: "Here is a plan for a birthday dinner: 1. Choose a theme. 2. Send invitations three weeks ahead. 3. Plan a three-course menu with a roast as the main dish...",
              verdict: "weak",
              why: "A generic plan for a party it invented. Nothing fits your guests or budget."
            },
            {
              label: "Detailed, then ask",
              prompt: "Help me plan a birthday dinner for 10 people at home, budget about $200, one guest is vegetarian. Before you plan anything, ask me any questions you need.",
              reply: "Happy to help. A few questions first: 1. Sit-down meal or casual buffet? 2. How much cooking do you want to do yourself? 3. Any other allergies? 4. Is there a favorite food of the birthday person?",
              verdict: "strong",
              why: "It found four gaps before writing a plan. The plan that follows will fit."
            }
          ]
        },
        attempt: {
          scenario: "You are planning a birthday dinner for 10 people at home. Budget is about $200. One guest is vegetarian and another cannot eat nuts. Here are three ways you could start.",
          instruction: "Pick the approach most likely to get you a plan you can use with the least back-and-forth, then say why in a sentence.",
          options: [
            { id: "A", text: "Plan a birthday dinner for 10 people.",
              feedback: "This one leaves out the budget, the vegetarian guest, and the nut allergy. The AI will guess, and you will spend several rounds correcting it." },
            { id: "B", text: "Plan a birthday dinner for 10 people at home. Budget $200. One guest is vegetarian, one cannot eat nuts. Give me a full menu and shopping list.",
              feedback: "Much better than A, and sometimes enough. But it still has to guess things you did not say, like how much you want to cook or whether it is a sit-down meal." },
            { id: "C", text: "Help me plan a birthday dinner for 10 people at home. Budget $200. One guest is vegetarian, one cannot eat nuts. Before you plan, ask me any questions you need.",
              feedback: "Yes. It has the key facts, and it gets a chance to ask about the rest before it writes anything." }
          ],
          whyPlaceholder: "I picked this one because..."
        },
        checks: [
          { id: "pick", label: "Picks the strongest approach", type: "choice", correct: "C", weight: 2,
            tip: "Look again at what each option leaves for the AI to guess.",
            note: "You picked the approach with the facts and room for questions." },
          { id: "why-ask", label: "Explanation mentions letting it ask questions", type: "anyOf", field: "why", terms: ["question*", "ask*", "clarif*", "check*", "missing", "forgot", "gaps"], weight: 1,
            tip: "Say what is special about C: it lets the AI ask about what you left out.",
            note: "You spotted the value of letting it ask first." },
          { id: "why-detail", label: "Explanation mentions the details", type: "anyOf", field: "why", terms: ["detail*", "budget", "vegetarian", "nut*", "allerg*", "fact*", "context", "information", "info", "specific*"], weight: 1,
            tip: "Mention the details too: budget, the vegetarian guest, the allergy.",
            note: "You noticed the details carry weight too." }
        ],
        facilitator: {
          minutes: 8,
          setup: "Show the three options. Take a quick hand vote before anyone submits, then reveal the feedback for each.",
          discuss: ["When is option B good enough on its own?", "Have you ever had an AI ask you a question back? What happened?"],
          watchFor: "Learners who pick B are not wrong to like it. Use their answers to talk about when one more round is worth it."
        }
      },
      {
        id: "check-the-facts",
        title: "Spot what needs checking",
        minutes: 8,
        type: "flag",
        passScore: 67,
        learn: {
          idea: "AI writes wrong facts in the same confident voice as right ones. Trust it for drafts. Check it on facts.",
          body: [
            "These tools predict likely-sounding text. Most of the time that text is correct. Sometimes it is a mistake, a myth, or a statistic that does not exist, and it reads exactly the same.",
            "The habit is simple: before you rely on a fact, number, quote, or study, look it up somewhere you trust. Pay extra attention to precise-sounding numbers with no source."
          ],
          compare: [
            {
              label: "Sounds right, is wrong",
              prompt: "Tell me a fun fact about goldfish.",
              reply: "Goldfish have a memory span of only three seconds, which is why they seem happy swimming in small bowls.",
              verdict: "weak",
              why: "This is a popular myth. Studies have shown goldfish can remember things for months. The confident tone gives no warning."
            },
            {
              label: "Asked for sources",
              prompt: "Tell me a fun fact about goldfish, and tell me how sure you are and what I could check.",
              reply: "Goldfish can be trained to respond to sounds and remember them for months. The \"three-second memory\" idea is a myth. A good place to check is an aquarium society or a university biology page.",
              verdict: "strong",
              why: "Asking for confidence and a way to check makes it easier to verify, though you still need to check."
            }
          ]
        },
        attempt: {
          scenario: "You asked an AI for some facts about the Moon for your niece's school project. Here is the reply.",
          instruction: "Tick every sentence you would not pass on without checking first: anything wrong, or anything that sounds made up. Leave the rest.",
          sentences: [
            { id: "s1", text: "The Moon goes around Earth about once every 27 days.", suspect: false,
              explain: "True. About 27.3 days measured against the stars." },
            { id: "s2", text: "It is about 384,000 kilometers away, on average.", suspect: false,
              explain: "True. About 239,000 miles." },
            { id: "s3", text: "The Moon makes its own light, which is why it glows at night.", suspect: true,
              explain: "Wrong. The Moon reflects sunlight. It makes no light of its own." },
            { id: "s4", text: "The same side of the Moon always faces Earth.", suspect: false,
              explain: "True. It turns once for every trip around Earth." },
            { id: "s5", text: "A 2021 study found that 64 percent of people sleep worse during a full moon.", suspect: true,
              explain: "Check this. A precise number and a vague \"study\" with no name is a classic sign of a made-up statistic." },
            { id: "s6", text: "People first walked on the Moon in 1969.", suspect: false,
              explain: "True. Apollo 11, July 1969." },
            { id: "s7", text: "You can easily see the Great Wall of China from the Moon.", suspect: true,
              explain: "Wrong. A popular myth. It is far too narrow to see from that distance." },
            { id: "s8", text: "The Moon is drifting away from Earth by a few centimeters each year.", suspect: false,
              explain: "True. About 3.8 centimeters a year." }
          ]
        },
        checks: [
          { id: "flags", label: "Flags the claims that need checking", type: "flags", weight: 3,
            tip: "Look for anything that contradicts what you know, and any precise number with a vague source.",
            note: "You caught the claims that would have embarrassed your niece." }
        ],
        facilitator: {
          minutes: 8,
          setup: "Ask everyone to work alone first, then compare with a neighbor before revealing the answers.",
          discuss: ["Which wrong sentence was hardest to spot, and why?", "Where would you go to check a fact like these?"],
          watchFor: "Over-flagging is a fine instinct. Point out that checking a true fact costs a minute; passing on a false one costs more."
        }
      },
      {
        id: "keep-it-private",
        title: "Keep private details out",
        minutes: 7,
        type: "redact",
        passScore: 85,
        learn: {
          idea: "You rarely need to paste personal details to get good help. Leave out names, numbers, and addresses, and describe the situation instead.",
          body: [
            "Whatever you type into an AI tool may be stored, reviewed, or used to improve the service, depending on the tool and your settings. Treat it like writing on a postcard.",
            "You almost never need the real details. \"My son\" works as well as his full name. \"Our address\" works as well as the street. You can fill the real details into the draft yourself afterward."
          ],
          compare: [
            {
              label: "Everything pasted in",
              prompt: "Write a note for Jordan Ellery, 18 Birchwood Court, phone 555-010-7731, asking the gym to pause membership 88231 for two months.",
              reply: "Dear Membership Team, I, Jordan Ellery of 18 Birchwood Court, am writing to request a two-month pause of membership 88231...",
              verdict: "weak",
              why: "The note is fine, but a full name, address, phone, and member number were shared for no benefit."
            },
            {
              label: "Placeholders",
              prompt: "Write a short note asking my gym to pause my membership for two months. Use [NAME] and [MEMBER NUMBER] where my details go.",
              reply: "Hi, I would like to pause my membership ([MEMBER NUMBER]) for two months starting this month. Please let me know if you need anything else. Thanks, [NAME]",
              verdict: "strong",
              why: "Same quality, nothing private shared. You fill in the brackets yourself."
            }
          ]
        },
        attempt: {
          scenario: "A friend drafted this request and is about to paste it into an AI tool. Every personal detail in it is made up for this exercise.",
          instruction: "Edit the request so it still gets the same help but contains no names, numbers, email, or address. Replace them with placeholders like [NAME] or leave them out.",
          starter: "Help me write a note to my son's school. My name is Dana Whitfield and my son is Theo Whitfield, student ID 4471985. We live at 42 Larkspur Lane, Millbrook. My email is dana.whitfield@example.com and my phone is 555-013-2847. Theo will miss school this Friday for a dentist appointment and I want to ask for his homework in advance.",
          placeholder: ""
        },
        checks: [
          { id: "names", label: "No real names", type: "absent", terms: ["dana", "whitfield", "theo"], weight: 2,
            tip: "A name is still in there. Swap it for [NAME] or \"my son\".",
            note: "No names left." },
          { id: "email", label: "No email address", type: "absent", patterns: ["[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}"], weight: 1,
            tip: "The email address is still there. The AI does not need it.",
            note: "Email removed." },
          { id: "phone", label: "No phone number", type: "absent", patterns: ["\\d{3}[\\s.-]?\\d{3}[\\s.-]?\\d{4}"], weight: 1,
            tip: "The phone number is still there.",
            note: "Phone number removed." },
          { id: "id", label: "No student ID", type: "absent", patterns: ["\\b\\d{5,}\\b"], weight: 1,
            tip: "A long ID number is still there.",
            note: "ID number removed." },
          { id: "address", label: "No street address", type: "absent", terms: ["larkspur", "millbrook"], patterns: ["\\b\\d+\\s+[a-z]+\\s+(lane|ln|street|st|avenue|ave|road|rd|drive|dr|court|ct)\\b"], weight: 1,
            tip: "The street or town is still there.",
            note: "Address removed." },
          { id: "keeps-ask", label: "Still asks for the same help", type: "allOf", groups: [["school", "teacher"], ["friday", "miss*", "absent", "out of school", "dentist", "appointment"], ["homework", "work", "assignment*"]], weight: 2,
            tip: "Do not cut the actual request: a note to the school about missing Friday and getting homework ahead.",
            note: "The request itself survived the edit." }
        ],
        facilitator: {
          minutes: 7,
          setup: "Remind the room that every detail in the exercise is fictional. Ask what kinds of details they paste into tools today.",
          discuss: ["Which details would you have left in without thinking?", "Does your workplace or school have a rule about what can go into AI tools?"],
          watchFor: "Learners who delete the whole request. The last check catches it and explains why."
        }
      },
      {
        id: "fix-the-reply",
        title: "Talk back to fix a bad reply",
        minutes: 9,
        type: "prompt",
        passScore: 75,
        learn: {
          idea: "The first answer is a draft. Tell it exactly what is wrong and what to change, in plain words.",
          body: [
            "People who get great results from AI are not better at first prompts. They just keep going. They say what missed and what to do instead.",
            "Good follow-ups are specific: \"Shorter, under a minute out loud\", \"They met at work, not college\", \"Warmer, less formal\". Vague ones like \"make it better\" give it nothing to aim at."
          ],
          compare: [
            {
              label: "Vague follow-up",
              prompt: "Make it better.",
              reply: "Certainly. Here is an improved version with more polished language and a stronger closing...",
              verdict: "weak",
              why: "It cannot tell what you disliked, so it changes the wording and keeps the problems."
            },
            {
              label: "Specific follow-up",
              prompt: "Too long and too formal. Cut it to about 100 words, make it warmer, and remove the part about their first date, which you made up.",
              reply: "Here is a shorter, warmer version, with the made-up story removed...",
              verdict: "strong",
              why: "Every change is named. It can fix all three problems in one go."
            }
          ]
        },
        attempt: {
          scenario: "You asked: \"Write a toast for my sister's wedding.\" The AI replied with a four-minute speech that sounds like a greeting card and says she met her husband in college. She did not: they met at a climbing gym.",
          instruction: "Write your next message to the AI to fix the toast. Say what is wrong and what you want instead.",
          starter: "",
          placeholder: "e.g. This is too long. Make it..."
        },
        checks: [
          { id: "length", label: "Asks for a length change", type: "anyOf", terms: ["shorter", "too long", "minute*", "seconds", "words", "brief*", "cut", "trim", "short"], weight: 1,
            tip: "Four minutes is too long for a toast. Say how long you want it, like \"about one minute\".",
            note: "You asked for a better length." },
          { id: "correct", label: "Corrects the made-up part", type: "anyOf", terms: ["college", "not true", "didn't", "did not", "never", "wrong", "actually", "made up", "climbing", "gym", "instead"], weight: 2,
            tip: "It invented a detail. Tell it they did not meet in college, and say where they actually met.",
            note: "You corrected the invented detail." },
          { id: "detail", label: "Adds a real detail", type: "anyOf", terms: ["climbing", "gym", "her name", "his name", "named", "she loves", "she is", "she's", "they love", "they both", "we grew up", "when we were"], weight: 1,
            tip: "Give it one real detail to use, like where they met or something about your sister.",
            note: "You gave it something true to work with." },
          { id: "tone", label: "Names the tone you want", type: "anyOf", terms: ["warm*", "funny", "funnier", "heartfelt", "personal", "casual", "less formal", "sincere", "sweet", "light*", "humor*", "cheesy", "greeting card", "generic"], weight: 1,
            tip: "Say how it should feel: warmer, funnier, more personal, less like a greeting card.",
            note: "You set the tone." },
          { id: "words", label: "Gives enough to act on (12+ words)", type: "minWords", min: 12, weight: 1,
            tip: "\"Make it better\" is not enough. Name a couple of specific changes.",
            note: "Enough detail to act on." }
        ],
        facilitator: {
          minutes: 9,
          setup: "Ask the room for the worst follow-up they could write, then the best. Write both on the board.",
          discuss: ["How many rounds of back-and-forth is normal?", "What do you do when it keeps making the same mistake?"],
          watchFor: "Follow-ups that only say what is wrong but not what to do instead."
        }
      }
    ]
  };

  const EVALUATION_LIMITS = [
    "Feedback comes from simple, fixed rules written for each lab: looking for certain words, word counts, and patterns. It runs in your browser and never calls an AI model.",
    "The rules check for the habits each lab teaches. They do not judge whether your writing is good, and a careful prompt can miss a rule because it uses words the rule does not expect.",
    "The rules can be fooled. Listing the right words will pass a check without the prompt being useful. Treat the score as a nudge, not a grade.",
    "The same input always gets the same feedback, so you can see exactly what changed between attempts.",
    "The sample replies in each lesson were written by hand to show a point. Real AI tools will reply differently each time.",
    "In the Name the failure lab, some replies could fit more than one cause. The answer key picks the main one, and the feedback explains why, so a different pick can still be a reasonable reading."
  ];

  return { COURSE, EVALUATION_LIMITS };
});
