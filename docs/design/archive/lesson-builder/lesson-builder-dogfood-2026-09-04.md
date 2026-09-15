# Lesson Builder dogfood: presentation course

## Scope

This pass used the existing Lesson Builder model to author a presentation-ready course in `web/data/lessons.json`: one three-lesson onboarding experience and three complete course modules, for 17 lessons total. The first three drafted Fundamentals lessons were preserved as the teaching exemplar.

This was a code-and-data dogfood pass. Browser automation was unavailable in the current environment, so the findings below come from tracing and exercising the authoring model, producing the lesson data, and validating it through unit tests and the production build. They do not claim a completed visual usability study.

## Friction found

1. A common teaching unit requires two separate insertions: one short explanation followed by one sentence-practice block.
2. Lesson sequences often reuse a previous lesson's structure, but only individual content blocks could be duplicated.
3. Long lessons were hard to size from the collapsed list because their headers showed no step count.
4. The course model could not distinguish a start-here tutorial from numbered teaching modules.
5. Adding the same curriculum references across a module and its lessons remains repetitive.
6. The Builder still requires field-by-field entry for every Spanish/English pair. That is workable for careful editing but slow for drafting a full module.

## Improvements made

- Added a **Teaching pair** insertion that creates an explanation and its immediate practice together, then focuses the new Spanish field.
- Added whole-lesson duplication with fresh IDs for every nested lesson, block, language block, and concept-link record.
- Added step counts to lesson headers so authors can judge lesson size before opening it.
- Added a module placement control for either numbered course content or start-here onboarding.
- Carried onboarding placement into the learner dashboard, where it appears as **Empieza aquí** and does not consume Module 1's number.
- Added automated presentation-course checks for module shape, answerability, unique IDs, non-empty lessons, and the James onboarding sequence.

## Deferred improvements

- **Bulk pair entry:** paste or type several Spanish/English rows and turn them into a practice block. This is the highest-value next authoring shortcut, but its interaction should be designed and visually tested before implementation.
- **Reusable concept sets:** apply a small saved group of curriculum concepts to related lessons without repeated search.
- **Answer policy helpers:** offer deliberate punctuation, capitalization, and contraction alternatives instead of requiring each alternative to be typed manually.
- **Course-level audit:** show lesson length, missing final practice, concept coverage, and unresolved validation across all modules in one compact view.

## Teaching observations

- The explanation-then-retrieval rhythm maps cleanly onto the current two block types.
- Short final sentences are straightforward to author; cumulative sentences become tedious because each phrase needs repeated block setup.
- The onboarding works best as real learning content. Greeting James and introducing Ana teaches the interaction model while giving the learner immediate English they can use.
- Deterministic, readable IDs made a large handcrafted course reviewable without changing the runtime lesson contract.

## Next validation pass

Run all 17 lessons on desktop and mobile as a learner, checking first-attempt answerability, pacing, strict punctuation and capitalization, wrapping of long language blocks, help behavior, and the transition from onboarding into Module 1. Revise lesson content before treating these modules as a production curriculum claim.
