# Ingles Con Confianza

Ingles Con Confianza is an English-learning application for Spanish-speaking adults. It combines the owner's teaching methodology with a queryable Spanish-first curriculum, a handcrafted Lesson Builder, and an interactive Practice experience.

The project is currently entering curriculum curation. All former curriculum source folders have been captured in PostgreSQL and retired. The next objective is to make the database selective and consistent, then use it to build the first production course module.

## Product shape

- PostgreSQL stores canonical curriculum concepts, collections, review history, and immutable source provenance.
- Lesson Builder stores handcrafted lessons in `web/data/lessons.json` while the lesson contract continues to be proven through real authoring.
- Practice renders the same lesson model used by author previews.
- Curriculum, lesson composition, and future learner history remain separate data boundaries.

## Start here

- [Product brief](docs/product-brief.md)
- [Active backlog](docs/backlog.md)
- [Teaching methodology](docs/teaching-methodology.md)
- [Curriculum database contract](docs/curriculum-database.md)
- [Project timeline](docs/history/project-timeline.md)
- [Web application setup](web/README.md)

## Technology

The application uses Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Prisma. Curriculum writes are protected by relational constraints and transactional workflows; immutable snapshots support reproducible database bootstrap and exact parity verification.

## Current priorities

1. Remove low-value and malformed curriculum concepts, merge duplicates, normalize retained mappings, simplify collections, and make `core` and `supporting` genuinely selective.
2. Build Module 1 as a sequence of short, first-attempt-answerable lessons and validate it end to end in Lesson Builder and Practice.

Detailed commands and local setup are documented in [`web/README.md`](web/README.md).
