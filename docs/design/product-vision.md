# Inglés con Confianza — the vision, and what the three pre-alpha modules need

> Written 2026-09-16 for the pre-alpha: three empty modules (Confianza I, II, III) to be
> authored by the owner and shown to friends. This document says what the product is
> trying to be, what "better than Duolingo" means concretely, what the three modules
> should promise, and what the builder, the data model and the learner app still need
> before that content can be written and shown. The methodology itself lives in
> `../teaching-methodology.md`; this document does not repeat it, it applies it.

## 1. The promise in one sentence

**In a few minutes a day, a Spanish speaker with no confidence in English starts
saying real sentences, and every session ends with proof that they can say something
they could not say before.**

Not "learn English". Not "practise vocabulary". *Say things.* The unit of progress is a
sentence the learner would actually use in Bogotá tomorrow, built from pieces they
retrieved themselves.

## 2. What we are, in contrast to what exists

**Duolingo** optimises for daily return. It is good at that and bad at teaching: it
rewards recognition (tap the right tile), scatters unrelated sentences, never explains
the pattern, and punishes (hearts, streak loss). A Duolingo learner can recognise a lot
and produce very little.

**Michel Thomas** optimises for production. A patient teacher gives one small idea,
asks you to build with it immediately, and never lets you fail in a way that hurts.
Everything is cumulative: by minute twenty you are producing sentences you were never
"taught", because you were taught the pieces and the pattern. The weakness: it is
linear audio, it cannot adapt, it cannot let you type, and it has no memory of you.

**Direct Instruction** (Engelmann) gives the discipline: one teaching focus at a time,
explicit examples before rules, immediate guided practice, mastery before moving on,
faultless communication (if the learner can misinterpret the example, the example is
wrong, not the learner). And its hardest rule: **if the student fails, the lesson is at
fault.** That rule is already in the methodology as *first-attempt answerability* and
*the student is never wrong*.

**Flow** (Csikszentmihalyi) gives the pacing: one reachable action, instant response,
visible movement, difficulty that rises only by recombining what is already known.

Inglés con Confianza is the intersection: **Michel Thomas's cumulative production, with
Direct Instruction's rigour, at Duolingo's cadence, without Duolingo's punishment.**

What that means in the product, concretely:

| Duolingo does | We do instead |
|---|---|
| Tap tiles from a word bank | Type the English yourself; recognition while typing, no submit button |
| Random sentences ("the bear drinks beer") | Every sentence is something the learner would say this week |
| Never explains | Two examples, then the pattern in one line, then you predict the next ones |
| Hearts, streak loss, "wrong" sounds | No penalties, unlimited hints, an unmatched answer is a signal, not a fault |
| Progress = XP and days | Progress = sentences you can now say, shown to you at the end of every lesson |
| 5 to 15 minute sessions | 2 minute lessons that end at a real milestone so "one more" is the natural next move |
| Isolated skills tree | One spine: verbs first, everything else hangs off what you can already say |

## 3. Why it is addictive without being manipulative

The addictive loop we want is the one Michel Thomas already has, made visible:

1. **Micro-wins every few seconds.** Each slide asks for one thing. Correct answers are
   recognised as you type. No submit, no wait.
2. **The "I said that" moment at the end of every lesson.** The completion screen shows
   the last sentence you built, in English, and says in Spanish: this is what you can
   say now. That is the dopamine we are after: evidence, not confetti.
3. **The next lesson always looks tiny.** Two minutes, one promise, shown before you
   start ("Aprende a decir *I need to go*"). Perceived commitment is what stops people
   from starting; we keep it near zero.
4. **Cumulative sentences that feel bigger than the pieces.** By lesson eight the
   learner produces "I want to do something with you because I can" and feels the
   pieces click. That feeling *is* the product.
5. **Never a bad session.** No streak to lose, no hearts to protect, no failure state.
   The learner comes back because the last session felt good, not because a notification
   threatened them.

Later, retrieval scheduling (Anki-like) will keep old pieces coming back inside new
sentences. That is how Michel Thomas works too: nothing is ever "done", it just becomes
one more block you build with.

## 4. The free foundation and the paid depth

The business shape is freemium by **module**, not by feature, not by hearts, not by ads:

- **Free forever: the foundation.** Everything a person needs to start speaking:
  Level 1 (*I and you, affirmative, present or going-to*) and the first steps beyond.
  The free tier must be genuinely complete and genuinely good, because it *is* the
  marketing. Someone who finishes it should be able to hold a small conversation and
  should want more.
- **Paid: the depth.** Questions and negation, he/she/they, the past, the conditional,
  the ser/estar/poder families in full, pronunciation, the long tail of useful verbs.
  Priced once someone already knows the method works for them.

The three pre-alpha modules are the free foundation, or the first three pieces of it.
The data model must therefore already know that a module has an **access tier**, even
though nothing enforces it yet. Retrofitting "which modules are paid" onto content that
was authored without the distinction is exactly the kind of migration we should avoid.

## 5. The three modules: what each should promise

The spine is Level 1 (`../curation/level-1.md`): 45-odd items, verbs first, *I and you,
affirmative, present or going-to*. Three modules of roughly 8 to 12 two-minute lessons
each is enough to cover it with cumulative reuse. The proposal below is a sequencing
suggestion, not a decision; the owner authors the content and will re-cut it. What
matters is that each module has **one promise the learner can say in Spanish before they
start and prove in English when they finish.**

**Confianza I — "Quiero, necesito, puedo"** (*what I want, need and can do*)
Promise: *Al terminar puedes decir lo que quieres, necesitas y puedes hacer.*
Spine: I · want · to + verb · need · can + bare verb · do · make · something · it · and ·
because · the surprise that *puedo* is one word, *can*.
Final sentence of the module, built entirely from taught pieces: **"I want to do
something because I can."** Lesson 1 doubles as onboarding: it teaches the interaction
(type, get recognised, ask for help) while teaching *quiero → I want*. A separate
onboarding module is not needed; a first lesson that assumes nothing is.

**Confianza II — "Tú y yo"** (*you and me*)
Promise: *Al terminar puedes hablarle a otra persona de lo que tienen que hacer juntos.*
Spine: you · me · with me / with you · for me / for you · my / your · have · have to ·
would like · like · know (that / if) · that · if · or · but.
Final sentence: **"I know that you have to go, but I would like to do it with you."**

**Confianza III — "Aquí y ahora"** (*here and now: being, going, place and time*)
Promise: *Al terminar puedes decir dónde estás, adónde vas y cuándo.*
Spine: be (ser / estar → one *be*, the contraction *I'm*) · going to · go to / go home ·
there is / there are · here · there · today · tomorrow · now · later · always · very ·
so · a lot · when · so / then.
Final sentence: **"I'm going to go home now because there's a lot to do tomorrow."**

Each module ends with a lesson that is *only* recombination: no new pieces, three or
four increasingly long sentences, the last one being the module's promise. That lesson
is the free tier's sales pitch.

## 6. Metadata the product needs (store now, surface when needed)

Everything below is optional in the file and defaults sensibly, so nothing existing
breaks and the owner can ignore any field. "Learner" means shown on `/` or in practice;
"teacher" means builder-only.

**Course** (the file itself, one per deployment)
- `title`, `tagline` (learner, Spanish). Today hard-coded in the learner shell.

**Module**
- `name` — exists. Learner-facing, so Spanish or a proper name ("Confianza I").
- `description` — **new, learner + teacher.** One or two Spanish sentences: the promise.
  Shown on the learner home under the module name and as the "what you will be able to
  say" before lesson 1. The teacher writes it in the module header.
- `status: "draft" | "published"` — **new.** Draft modules are invisible to learners.
  Lets the owner author Confianza III while friends use I and II. Default `published`
  for existing files so nothing disappears.
- `access: "free" | "premium"` — **new, stored, not enforced.** A quiet badge in the
  builder; nothing on the learner side until payments exist.
- `kind: course | onboarding` — exists; likely retired once lesson 1 is the onboarding.
- `syllabus.main / review` — exists; the derived coverage already gives "done".
- Derived, never stored: lesson count, total minutes, coverage.

**Lesson**
- `name` — exists. Should read as a promise the learner can say: "Quiero → I want".
- `status: "draft" | "published"` — **new.** Same reason as the module. A lesson the
  owner is mid-writing must not appear on a friend's phone. Default `published`.
- `notes` — **new, teacher-only,** free text that never reaches the learner: why this
  lesson exists, what to fix, what the friend said. Cheap to add now, painful to bolt
  on later because people will start putting it in explanations.
- Derived: the promise sentence (already `lessonOutcome`: the last practised sentence),
  minutes, step count, first-sighting concepts.

**Slide** — no new fields. The pronunciation bridge the methodology requires
(`DIFF-rent, dos sílabas`) is authored inside an explanation, where it belongs next to
the word. `callout` on a piece already carries incidental context hints (`arete =
earring`). `given` already marks untested pieces.

**Learner history** (later, local only for the MVP): attempts, help requests, exposure
per concept id. The concept ids on lessons and syllabus items are what make future
retrieval scheduling possible, which is why the builder keeps nudging the owner to tag
concepts. Nothing to build now beyond keeping those ids stable.

## 7. What the builder needs before the modules are written

In priority order. Items 1 to 3 block authoring; 4 onward can land while the owner
writes.

1. **Module header with identity, not just a title.** Name inline-editable in place;
   under it a quiet one-line description field (placeholder: "What will the learner be
   able to say?"); at the right, small pills for status (Draft / Published) and access
   (Free / Premium), visible at rest, one click to toggle, no dialogs. Same blue header,
   no new colours. The trash icon stays at the far right.
2. **Draft status on lessons**, shown as a small dashed "Draft" tag in the lesson row
   header, toggled from the row's icon cluster and from the keymap (lesson scope).
   Learner surfaces (home, practice, course summary) filter out drafts and draft modules
   server-side, so a URL to a draft lesson falls back to the course home.
3. **Order of elements on the page** is right in principle (syllabus card above the
   module card, per the owner's decision) but the module card should carry its promise
   before its lessons: header → description → lessons. The empty state "Create lesson"
   is fine; add one line under it: "Lesson 1 is the learner's first contact. Assume
   nothing." because the first lesson is the onboarding.
4. **Script mode is unchanged.** Lessons have no description (the promise is derived
   from the last practised sentence) and the module description is not part of a lesson
   script.
5. **Export includes the new fields; import tolerates their absence.** Round-trip test.
6. **Course-level title and tagline** stay hard-coded until the learner polish phase;
   moving them into the file is a five-minute job then.

Not needed, deliberately: a separate onboarding module, lesson-level difficulty
ratings, tags, cover images, per-lesson access, versioning, comments, collaborators.

## 8. What the learner app will need from these modules (next phase, listed so authoring anticipates it)

- **The home is a path, not a catalogue:** the next lesson big, with its promise; the
  module's description; completed lessons quiet; locked nothing (no gates in the free
  tier, order is a suggestion the interface makes obvious).
- **Lesson 1 assumes nothing:** it teaches typing, recognition and help inside the first
  three slides. The builder cannot enforce this; the owner writes it that way.
- **The completion screen is the product:** the final English sentence large, its
  Spanish beneath, "Esto ya lo puedes decir", then the next lesson's promise and its
  two-minute estimate, one tap away.
- **Module completion** shows all the module's final sentences together: the learner's
  new repertoire in one screen. This is what friends will screenshot.
- **Phone first.** Friends will open the link on a phone. 390 px is the design width for
  the learner; desktop is the design width for the builder. Unchanged from the roadmap.
- **A feedback link** on completion ("¿Qué te pareció?") so the pre-alpha produces signal.

## 9. Open decisions for the owner

- Confirm or re-cut the three module promises in §5. The builder does not care; the
  syllabus card will show coverage against whatever Main list the owner enters.
- Whether *puedo → can* belongs in Confianza I (the "surprise" the Level 1 doc places
  right after *poder*) or is held for II. Recommendation: I. It is the single most
  motivating discovery in Level 1 and it makes the module-final sentence possible.
- Whether the description is the module's promise (recommended) or a longer blurb. One
  sentence the learner can say in Spanish beats a paragraph nobody reads.
