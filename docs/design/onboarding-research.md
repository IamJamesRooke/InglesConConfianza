# Onboarding research — how the best products onboard, and what we take from them

> Research only, 2026-09-18. Tags: **[fetched]** = I opened the URL and read it.
> **[search]** = Claude web-search summary only — a lead, not verified fact. Read with
> `docs/design/onboarding.md` (mechanism, decided), `docs/backlog.md` §Onboarding (owner's
> content wishes), `docs/teaching-methodology.md`, `docs/design/product-vision.md` §1–3.

## A. Referents

### 1. Duolingo — **[search, converging: userguiding.com, goodux.appcues.com, relaunch.ai, junoschool.org]**

Attempted `useronboard.com/how-duolingo-onboards-new-users/` directly; the fetch returned
only a bare numbered list (1–78), no captions — its famous screen-by-screen content was
not retrievable this session. The sequence below is the consensus of four independent
secondary teardowns, not that primary source.

1. Mascot "Duo" greets the visitor.
2. "Why are you learning?" (travel/school/work/other) — no wrong answer, flavors later
   content, gates nothing.
3. Daily-minutes goal commitment (5/10/15/20 min) — the streak system is introduced here.
4. New learners skip straight to lesson 1; returning/experienced learners may opt into a
   placement test instead.
5. **The first lesson runs before any account exists**; sign-up is deferred to after a
   completed lesson (or a later feature wall). Two teardown blogs report a delayed-signup
   A/B test raised DAU 20% — not a primary Duolingo source, treat as directional.
6. Notification priming and full streak weight come after the first session, not before.
7. **Time to first core action:** ~3–4 minutes to a finished first lesson.
8. **Tone:** playful, mascot-led, low-stakes; first lesson uses tap/word-bank, not typing.
9. **Deferred:** account, streak weight, notifications, placement rigor for new learners.
10. **Skippable:** the placement test only; the motivation question is costless, not
    skippable, but any answer works.
11. **Why it works (per sources):** value before the ask; the goal question is a small,
    safe commitment; nothing before lesson 1 needs more than a sentence of reading.
12. **Why it could fail for us:** it assumes language-app literacy (streaks, comparisons)
    our audience may not have; a Duolingo-style goal screen risks feeling like homework
    to a low-confidence learner, not a promise.

### 2. Babbel, Busuu, Memrise, Speak, Lingvist — **[search]**, brief

- **Babbel**: no placement test, one fixed course for everyone; short lessons that
  explain grammar rules explicitly up front — the opposite of our discovery-first rule.
- **Busuu**: CEFR-aligned; a real placement test sets the starting level; native-speaker
  video as a differentiator.
- **Memrise**: closer to a flashcard tool than a taught sequence; leans on native video.
- **Speak**: AI conversation practice as the core loop rather than a discrete onboarding.
- **Lingvist**: no independently reportable onboarding detail found — not covered here.

None of these is reported delivering a taught, produced sentence inside two minutes the
way our mechanism intends; Babbel's grammar-first opening is the clearest anti-pattern.

### 3. Non-language products

- **Headspace [search]**: opens with a live breathing exercise the user does immediately
  — the core mechanic *is* screen one — then three short one-tap questions (experience,
  session length, "what brought you here"). About a minute total. Closest referent to
  what we want: **do the mechanic first, ask about the person second, one tap per ask.**
- **Slack [search]**: teaches by doing — the setup checklist has the user actually send a
  message, not read about messaging.
- **Notion / Airtable / Figma / Linear [search]**: never open on a blank canvas; a
  template, starter content, or seeded issues make the first action editing something
  real, not creating from zero.
- **Superhuman [search, First Round Review]**: "concierge onboarding," a live guided
  session (cut from 90 to 30 minutes without losing activation). Not applicable to our
  no-accounts context, but the underlying idea — a teacher voice walking the *first real
  use* — matches our "teacher voice" methodology.
- **Super Mario World 1-1 [search, gamedeveloper.com, Medium/Iyer, CBR]**: teaches jump
  timing and enemy mechanics purely through obstacle placement, never a text box — an
  "invisible tutorial." Each mechanic appears once in a safe setup, then repeats slightly
  harder. Strongest cross-domain match for "teach by doing" and our own "one teaching
  focus at a time" / "micro-steps" rules.

## B. Evidence and principles

- **Do users read tutorials? [fetched, nngroup.com/articles/onboarding-tutorials]** Mostly
  no — the "paradox of the active user": people want to act, not study. Upfront/"push"
  tutorials interrupt, force out-of-context memorization, and don't improve task
  performance. NN/g recommends "pull" (contextual, user-triggered) help, and where upfront
  onboarding is unavoidable, keep it brief, optional, minimal.
- **Mobile reading load [search, nngroup.com]**: many instructions at once raises
  cognitive load and is forgotten once the overlay closes; a 2016 NN/g mobile study found
  simple text reads fine on phones but difficult/long text slows readers — brevity matters
  more where most of our audience is.
- **Time-to-first-value / "aha moment" [search, SaaS-growth blogs, not peer-reviewed]**:
  loosely-sourced industry rules of thumb (activation "under 15 min," "under 8 min" for
  simple products) — directional only, not precise targets.
- **Progressive disclosure [search]**: reveal complexity only as readiness allows; claimed
  20–40% task-time reduction (industry-blog sourcing), but the underlying HCI concept is
  well established and matches our own "one teaching focus at a time" rule.
- **Endowed progress / goal-gradient effects [search, citing Nunes & Drèze 2006, J.
  Consumer Research 32(4):504–512; Kivetz, Urminsky & Zheng 2006]**: people work harder as
  a goal feels closer, and an artificial head start increases completion. This traces to
  peer-reviewed behavioral economics, not just a blog claim, and directly supports the
  mechanism's whole-onboarding progress bar over per-lesson-only progress.
- **Commitment and consistency [search summary of nngroup.com/articles/commitment-consistency-ux]**:
  a small, low-stakes early commitment increases follow-through on later related asks —
  relevant to goal-setting screens and to our own "say it out loud" instruction.
- **Krashen's Affective Filter Hypothesis [search, converging summaries]**: anxiety, low
  confidence, and low motivation raise a mental filter that blocks acquisition even with
  good input; language learning is unusually exposure-to-embarrassment-prone because it
  requires public production. Repeated implication: lower the filter — safety, low
  stakes, no visible judgment — before asking for production. Already encoded in our
  "student is never wrong" rule; argues for zero visible failure risk in onboarding's
  first production.
- **Self-efficacy / early success**: no single peer-reviewed citation was independently
  verified here; the claim that early wins raise self-efficacy and lower next-attempt
  anxiety is a reasonable inference from Krashen plus general self-efficacy theory, not a
  confirmed standalone study — flagged as converging inference, not fact.

## C. Synthesis for us

### 1. Rules, each tied to a referent or source

1. **Deliver the core action before any non-core question.** (Duolingo's pre-signup
   lesson; Headspace's immediate breathing; NN/g's "paradox of the active user.")
2. **Ask nothing that isn't load-bearing.** Duolingo's motivation question is low-cost
   because it changes nothing critical; cut anything before the first typed answer that
   doesn't earn its place (NN/g: push tutorials reduce usability).
3. **Teach mechanics by doing, not telling.** Slack's "send a message," Mario 1-1's
   obstacle-as-teacher, and our own "discovery over memorization" rule agree: a sentence
   that requires typing beats an instruction slide about typing.
4. **Never start from a blank state.** Notion/Linear pre-seed content; we pre-seed the
   first sentence with the learner's own name.
5. **Show whole-journey progress, not per-step only.** Endowed-progress/goal-gradient
   research (Nunes & Drèze 2006) backs the mechanism's whole-onboarding bar.
6. **Make the first required commitment tiny and costless** — a checkbox, a name, a tap,
   never a form (commitment-consistency; also keeps reading load low per NN/g).
7. **Zero visible risk in the first production** — no wrong-sound, no score, no
   comparison (Krashen; our own "student is never wrong").
8. **Keep upfront text short; defer explanation to context.** NN/g: upfront info is
   skipped and forgotten — move "why this matters" to the moment it's needed.
9. **Promise before process.** Every referent that states a "why" does it briefly and
   before mechanics; put the owner's promise in slide 1, not the pre-alpha notice.
10. **One teaching focus per screen, immediately applied** — already our methodology,
    independently reached via progressive disclosure and NN/g cognitive-load findings.

### 2. Anti-patterns to avoid

- A goal-setting/"why are you learning" screen before any typing — right for Duolingo's
  audience, risky for ours (asks intent before any evidence of delivery).
- A multi-field form (name + email + goal) before value — contradicts delayed-registration
  evidence and the mechanism doc's own "name only for now."
- A dense "how this app works" paragraph read all at once — NN/g says it gets skipped;
  belongs taught by doing or as single-line context nudges.
- Any visible "wrong" state in the first two minutes — contradicts Krashen and our house
  rule.
- A placement test — wrong for a consistently low-confidence audience; nothing in the
  backlog asks for one; Busuu's only fits a CEFR product we aren't building.

### 3. Recommended length

- **Whole onboarding: 4–6 minutes** — Duolingo's ~3–4 minutes to first lesson, plus our
  mechanism's own real win-ending lesson on top.
- **3–4 short lessons**, matching the backlog's own sketch (promise/notice → name →
  punctuation-by-doing → first real sentence), each ending at a small milestone per the
  methodology's "short lessons and the one-more effect."
- **3–6 slides per lesson**, per the methodology's existing preference for several fast
  screens over one dense one.
- **Explanation slides: ≤ ~25–30 words**, one idea, one example pair — tighter than
  typical onboarding copy because our own methodology already requires holding one idea
  in working memory, and NN/g's mobile-reading findings say long/difficult text slows
  phone readers. This number applies our own documented rule plus mobile-reading
  evidence; it is not a borrowed industry figure.

### 4. Recommended order for the owner's content wishes

The mechanism is forced/unskippable/no-close-button — and the evidence base here leans
toward "let the user skip/pull," a real tension this document cannot resolve by changing
the mechanism (out of scope). The available mitigation: shrink what is *told* to almost
nothing, and move everything else into slides that are also the first real teaching, so
forced time is never wasted reading time.

- **First 60 seconds (told, not taught):** the promise (14+ years, zero-to-conversational,
  the "I want you to come here" example) in one short slide — the one place upfront
  telling is justified, since it's motivational framing, and Headspace/Superhuman both
  open with a promise beat before mechanics. Then the pre-alpha/localStorage notice as a
  *single-sentence* acknowledge checkbox, per the mechanism doc.
- **Taught by doing, inside the first real mini-lesson:** "best with a keyboard" — don't
  state it as a rule; let the first sentence slide simply work well on a keyboard.
  "Say the answers out loud" — state it once, briefly, right where the first speaking cue
  appears (pull, not push; also the commitment-consistency ask-right-before-the-behavior
  pattern). Punctuation rules — exactly as the owner sketched: taught through two or three
  tiny sentences that need punctuation, not a rules slide.
- **A single short slide, not a preamble:** "follow the lesson order even if it feels
  easy" concerns *later* lessons, so it belongs as one line at the very end of onboarding,
  not competing with the promise at the start.
- **Cut or move later:** an early standalone name-question purely for personalization
  (Duolingo/Headspace-style) isn't supported before value is shown; the mechanism doc
  already places name-capture inside real teaching ("Hola, mi nombre es…") — keep it
  there, don't front-load it. "Feedback matters" should stay a quiet, always-visible pill
  (already decided), not a slide — stating it upfront is exactly what NN/g says gets
  skipped; a persistent button is the "pull" version of the same message.

### 5. The promise, ≤ 25 words, Latin American Spanish (tú)

1. "Llevo más de 14 años ayudando a hispanohablantes a hablar inglés. En una hora dirás
   cosas que a otros les toma años aprender." (24 words)
2. "En 14 años he llevado a cientos de estudiantes de cero a hablar con confianza. Hoy
   empiezas tú, y en una hora ya dirás frases reales." (25 words)
3. "Con más de 14 años enseñando, sé exactamente cómo pasar de cero a hablar inglés.
   Dentro de una hora, dirás cosas que muchos nunca aprenden bien." (24 words)

All three lead with the credential, name the destination, and give a time-boxed promise,
per the backlog's "open with a promise not a warning."

### 6. First English sentence for a nervous beginner, inside two minutes

**"I want to go."** — or any "I want to [verb]" built from *quiero → I want*, already the
Confianza I spine in `product-vision.md`. Reasoning:

- Short enough to type with near-zero spelling risk (mobile-reading + micro-steps rules).
- Reuses the actual course spine, so the win is a real building block, not a throwaway
  demo — satisfying first-attempt answerability and the vision doc's own anti-Duolingo
  distinction ("every sentence is something the learner would say this week").
- A statement of intent, not a question — the lowest-anxiety sentence type per Krashen:
  no contradiction risk, no social stakes.
- Can be personalized immediately with the captured name in the same slide ("Hola, mi
  nombre es [name]… I want to…"), compounding the commitment-consistency small-ask with
  the first production in one place.

## Confidence and gaps

- **High confidence, fetched:** NN/g's push-vs-pull onboarding position
  (`nngroup.com/articles/onboarding-tutorials`, read directly); the endowed-progress
  effect traces to a named peer-reviewed study (Nunes & Drèze 2006) though I read only a
  search summary citing it, not the journal article.
- **Medium confidence, converging search summaries, not fetched:** the Duolingo sequence
  and its "20% DAU" delayed-signup figure rest on agreeing secondary teardowns, not
  Duolingo's own documentation; the useronboard.com primary teardown could not be read
  this session (fetch returned a bare numbered list, no captions).
- **Lower confidence, industry-blog only:** TTFV numeric benchmarks and the 20–40%
  progressive-disclosure figure — marketing/growth blogs, not peer-reviewed; directional
  only.
- **Not found:** no independently reportable Lingvist onboarding detail; no confirmed
  standalone study quantifying self-efficacy gains in a language app's first five
  minutes (Krashen-plus-inference only).
- **Honest tension:** the evidence favors skippable/pull onboarding; our mechanism is
  forced and unskippable by owner decision. This document does not resolve that
  conflict — it recommends minimizing told content to one promise + one-line notice and
  moving the rest into taught-by-doing slides as the best available mitigation.

## Sources

- [How Duolingo Onboards New Users — UserOnboard](https://www.useronboard.com/how-duolingo-onboards-new-users/) — attempted fetch, page returned a bare numbered list only.
- [Duolingo — UX and onboarding breakdown — UserGuiding](https://userguiding.com/blog/duolingo-onboarding-ux) — search summary.
- [Duolingo's onboarding experience — GoodUX/Appcues](https://goodux.appcues.com/blog/duolingo-user-onboarding) — search summary.
- [Duolingo Onboarding Teardown — Relaunch](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html) — search summary.
- [The Duolingo Onboarding Experience — Juno School](https://www.junoschool.org/article/duolingo-onboarding-experience/) — search summary.
- [Gradual engagement — Appcues](https://www.appcues.com/blog/gradual-engagement-mobile-app-first-screen) — search summary.
- [Onboarding Tutorials vs. Contextual Help — NN/g](https://www.nngroup.com/articles/onboarding-tutorials/) — **fetched and read directly.**
- [Mobile-App Onboarding — NN/g](https://www.nngroup.com/articles/mobile-app-onboarding/) — search summary.
- [Mobile Tutorials — NN/g](https://www.nngroup.com/articles/mobile-tutorials/) — search summary.
- [Commitment and Behavioral Consistency — NN/g](https://www.nngroup.com/articles/commitment-consistency-ux/) — search summary.
- [Reading Content on Mobile Devices — NN/g](https://www.nngroup.com/articles/mobile-content/) — search summary.
- [Endowed progress effect — Renascence](https://www.renascence.io/us/behavioral-biases/endowed-progress-effect) — search summary; cites Nunes & Drèze (2006) and Kivetz, Urminsky & Zheng (2006).
- [Goal-Gradient Hypothesis — Yu-kai Chou](https://yukaichou.com/behavioral-analysis/goal-gradient-hypothesis-hull-kivetz-motivation-acceleration/) — search summary.
- [Affective Filter Hypothesis — Medium/Shirko](https://medium.com/@anastasia_68336/the-affective-filter-hypothesis-for-learning-a-foreign-language-71e936da2b61) — search summary.
- [Affective Filter — The TEFL Academy](https://www.theteflacademy.com/blog/what-is-the-affective-filter-in-language-learning/) — search summary.
- [Headspace onboarding teardown — Medium](https://tearthemdown.medium.com/product-teardown-headspace-user-onboarding-personalisation-b6effd0df1d7) — search summary.
- [Headspace's mindful onboarding — GoodUX](https://goodux.appcues.com/blog/headspaces-mindful-onboarding-sequence) — search summary.
- [Superhuman's Onboarding Playbook — First Round Review](https://review.firstround.com/superhuman-onboarding-playbook/) — search summary.
- [Onboarding UX: 10 patterns — Appcues](https://www.appcues.com/blog/user-onboarding-ui-ux-patterns) — search summary (Slack/Notion/Linear points).
- [Methods of creating invisible tutorials — Game Developer](https://www.gamedeveloper.com/design/methods-of-creating-invisible-tutorials) — search summary.
- [Analyzing Super Mario's level design — Medium/Iyer](https://medium.com/swlh/the-perfect-game-tutorial-analyzing-super-marios-level-design-92f08c28bdf7) — search summary.
- [World 1-1 influence — CBR](https://www.cbr.com/super-mario-bros-first-world-great-level-design-tutorial/) — search summary.
- [Memrise vs Babbel — Test Prep Insight](https://testprepinsight.com/comparisons/memrise-vs-babbel/) — search summary.
- [Busuu vs Babbel — Test Prep Insight](https://testprepinsight.com/comparisons/busuu-vs-babbel/) — search summary.
- [Language apps compared 2026 — HelloTalk](https://www.hellotalk.com/en/blog/language-learning-apps-compared-2026) — search summary.
