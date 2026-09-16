# Archived one-off scripts

These curation scripts already ran against the database and are kept for
provenance only. None are wired to an `npm run curriculum:*` entry point.

- `split-slashed-concepts.ts` — split slash-bundled concept rows (e.g. "el/la")
  into one row per variant.
- `split-verb-system.ts` — carved the grammatical verb machinery (ser/estar/
  haber/hay, perfect auxiliary, modals) out of the thematic Verbs page into a
  dedicated "Special Verbs" topic via the `topic:verb-system` tag.
- `derive-lemma-collections.ts` — derived lemma-based collections from the
  curriculum database.
- `audit-lessons-answers.ts` — audited a `lessons.json` file for legacy joined
  accepted-answer alternates and blank language blocks.
