# Repository guidance

Inglés Con Confianza is a language-learning application built from the owner's teaching methodology for Spanish-speaking adults in Bogotá. Treat the curriculum as core intellectual content and preserve its teaching logic.

## Current priorities

- The repository is currently in a lesson-authoring and curriculum data-model discovery phase. Follow `docs/curriculum/AGENTS.md` for direct curriculum-source work.
- Use the backlog and product documentation to understand the current stage; do not assume planned technology is already present.
- Infer commands, dependencies, and conventions from repository files. Never invent setup, build, lint, or test commands.

## Active handoff notes

- The Lesson Builder is the current center of product discovery. It saves handcrafted lesson content through `web/src/app/api/lesson-builder/lessons/route.ts` into `web/data/lessons.json`.
- The old SQLite/demo lesson prototype has been retired. Do not reintroduce SQLite or a relational schema unless the user explicitly asks for that direction again.
- The curriculum data model is not settled. The current hypothesis is graph-shaped: atomic nodes, mapping edges, evidence from lessons, and priority metadata. The experimental graph lives in `web/data/curriculum-graph.json`.
- `Contenido del curso` currently renders mapping cards from the experimental curriculum graph, not directly from raw lesson language blocks.
- Treat learner-facing lesson blocks as presentation/evidence, not canonical curriculum truth. Canonical mappings should live in the graph or future graph-derived database model.
- The earlier hypothesis that Spanish-to-English and English-to-Spanish require equally canonical directional edges is now under reconsideration. Do not extend or normalize the graph around that assumption until the owner resumes this discussion.
- The leading scope hypothesis to revisit is Spanish-first: because the course assesses Spanish-to-English production, canonical teaching mappings may all point from Spanish words, phrases, or constructions to natural English realizations. English forms such as `him`, `so`, `such`, and `that` may be better represented as derived target indexes or collision views that reveal all Spanish sources producing the same English result, rather than as a second English-to-Spanish curriculum.
- A possible bounded discovery flow is: seed from frequent, high-utility Spanish; enumerate its context-specific English realizations; derive English target buckets; then add only the other useful Spanish sources or constructions needed to teach important collisions. The stopping rule must use frequency, speaking priority, likely learner confusion, and stage appropriateness so this does not become an unlimited recursive expansion.
- Preserve phrase- and construction-level mappings such as `se lo di` → `I gave it to him` and `quiero que él haga algo` → `I want him to do something`; a word-only model cannot represent the proposed Spanish-first coverage.
- This Spanish-first model is a discussion handoff, not an approved schema migration. The owner intends to reconsider it before further curriculum database work.
- Speaking priority is currently modeled with `speakingPriority` values such as `core_function`, `high_utility`, `common_vocabulary`, `advanced_expression`, and `rare_or_archaic`; `learningTags` are separate metadata such as future `cognate` tags.
- `docs/teaching-methodology.md` is now the working reference for lesson design. It records first-attempt answerability, one teaching focus at a time, example-first discovery, immediate information/application micro-steps, limited incidental-vocabulary hints, short-lesson momentum, confidence-building endings, and learner-friendly North American pronunciation bridges without learner-facing IPA.
- `web/data/lessons.json` currently contains the tutorial placeholder plus four authored content lessons. The former long lesson 3 was split at the confidence milestone `It's important.`; preserve the current block order and teaching progression unless the owner requests another editorial change.
- Expect this model to change. Prefer small, reversible changes that help the owner inspect real lesson examples and refine the data model.

## Product and engineering decisions

- Work MVP-first. Prefer the smallest clear, maintainable solution to a demonstrated need.
- The intended application direction includes Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, authentication, payments, testing, containers, deployment, and OWASP Top 10 security practices. Introduce these only when the current task and project stage require them.
- Do not add microservices, Kubernetes, enterprise patterns, or speculative abstractions for portfolio signalling.
- Favor professional work the owner can understand, explain in an interview, and maintain independently.
- When implementation begins, treat security as part of design and testing. The long-term security portfolio should include threat modeling, authorization tests, a controlled penetration test, findings, and hardening—not unsupported claims of security.
- When updating the backlog after implementation work, record any security practice actually applied and the evidence that supports it. Keep implemented controls separate from planned security work, and do not claim protection that has not been tested.
- Keep changes within the requested scope. Do not turn focused work into unrelated architecture, automation, or maintenance.
