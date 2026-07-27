# Repository guidance

Inglés Con Confianza is a language-learning application built from the owner's teaching methodology for Spanish-speaking adults in Bogotá. Treat the curriculum as core intellectual content and preserve its teaching logic.

## Current priorities

- The repository is currently in a curriculum migration and normalization phase. Follow `docs/curriculum/AGENTS.md` for curriculum work.
- Use the backlog and product documentation to understand the current stage; do not assume planned technology is already present.
- Infer commands, dependencies, and conventions from repository files. Never invent setup, build, lint, or test commands.

## Product and engineering decisions

- Work MVP-first. Prefer the smallest clear, maintainable solution to a demonstrated need.
- The intended application direction includes Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, authentication, payments, testing, containers, deployment, and OWASP Top 10 security practices. Introduce these only when the current task and project stage require them.
- Do not add microservices, Kubernetes, enterprise patterns, or speculative abstractions for portfolio signalling.
- Favor professional work the owner can understand, explain in an interview, and maintain independently.
- When implementation begins, treat security as part of design and testing. The long-term security portfolio should include threat modeling, authorization tests, a controlled penetration test, findings, and hardening—not unsupported claims of security.
- Keep changes within the requested scope. Do not turn focused work into unrelated architecture, automation, or maintenance.

