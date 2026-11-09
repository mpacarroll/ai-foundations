// Realistic sample attempts for each lab: one a beginner might write first, one after revising.
// Used to prove the rules pass good work and catch the gaps the lab teaches.
module.exports = {
  "say-what-you-want": {
    weak: { text: "Write an email to my landlord about the sink." },
    strong: { text: "Write a short, polite email to my landlord. The kitchen faucet has been dripping for a week and I would like them to send a plumber to fix it by Friday." }
  },
  "who-its-for": {
    weak: { text: "Explain password managers." },
    strong: { text: "Explain what a password manager is to my uncle. He is 68, uses email and Facebook, and is not technical. Use plain words, no jargon, in about five short sentences." }
  },
  "let-it-ask": {
    weak: { choice: "B", why: "It is the longest." },
    strong: { choice: "C", why: "It has the budget and allergy details and lets the AI ask questions about what I forgot." }
  },
  "check-the-facts": {
    weak: { flags: ["s1"] },
    strong: { flags: ["s3", "s5", "s7"] }
  },
  "keep-it-private": {
    weak: { text: "Help me write a note to my son's school. My name is Dana and my son is [NAME]. Theo will miss school this Friday for a dentist appointment and I want his homework in advance." },
    strong: { text: "Help me write a note to my son's school. Use [MY NAME] and [SON'S NAME] as placeholders. He will miss school this Friday for a dentist appointment and I want to ask for his homework in advance." }
  },
  "fix-the-reply": {
    weak: { text: "Make it better." },
    strong: { text: "This is way too long and sounds like a greeting card. Cut it to about one minute, make it warmer and a bit funny, and fix the story: they did not meet in college, they met at a climbing gym." }
  },
  "name-the-failure": {
    weak: { picks: { c1: "invented", c2: "invented", c3: "ignored", c4: "invented", c5: "vague" } },
    strong: { picks: { c1: "ignored", c2: "invented", c3: "vague", c4: "outdated", c5: "agreed", c6: "invented" } }
  },
  "fix-the-generic": {
    weak: { text: "Give me some good dinner ideas please." },
    strong: { text: "Give me five dinner ideas for two people on weeknights. Each should take about 30 minutes. My partner does not eat dairy, and we are tired of pasta, so skip it." }
  },
  "ask-how-sure": {
    weak: { text: "How much liquid can I bring on a plane?" },
    strong: { text: "I am flying from the US to Canada next month. How much liquid can I pack in my carry-on bag? Tell me how sure you are, whether the rules may have changed recently, and which official website I can check." }
  },
  "check-the-summary": {
    weak: { flags: ["s1", "s5"] },
    strong: { flags: ["s2", "s5", "s7"] }
  },
  "push-back-well": {
    weak: { choice: "A", why: "It admitted its mistake so it must be right." },
    strong: { choice: "C", why: "It flipped just because I pushed back, so I need the actual requirements side by side and the official page to check." }
  }
};
