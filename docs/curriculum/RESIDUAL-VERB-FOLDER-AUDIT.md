# Residual Spanish-to-English verb-folder audit

> Created: 2026-08-21. This is an inspection report only; it does not migrate or delete source material.

## Scope

Audited remaining verb-like folders under `docs/curriculum/mappings/spanish-to-english/` against the PostgreSQL seed snapshots in `web/prisma/seed-data/`.

The goal is to identify source folders left after the verb-family import pass so the next phase can decide whether to migrate, reconcile, retain as contrast material, or delete empty leftovers.

## Summary

- Several live verb folders still contain useful Spanish-to-English mappings with no corresponding curriculum concepts or review candidates.
- Some folders are partially represented in PostgreSQL through related English phrasal-verb audits, but their Spanish-first family is not complete.
- Some folders now contain only confusion/pronunciation material after their concepts were migrated.
- There are many empty leftover directories from prior moves and source consumption; those should be cleaned in a separate deletion phase after owner confirmation.

## File-bearing residual verb folders

| Folder | Source status | DB/review coverage observed | Recommended next action |
|---|---|---|---|
| `acordar/` | Rich unmigrated family: agree, decide, agree on / reach agreement, remember, remember doing, remind, can't remember, agree-vs-remember contrast. | No matching approved concepts or review candidates found. | Create review batch. Likely high-value because it contains non-compositional pronominal `acordarse de` meanings. |
| `aparecer/` | README has appear, show up, be listed, come out/published. | No matching concepts or review candidates found. | Create review batch. |
| `buscar/` | README has ordinary `buscar` → look for and official `buscar a [alguien]` → want [somebody] for questioning. | Only incidental `mandar a buscar a [alguien]` concept found; `buscar` family itself not migrated. | Create review batch or include with residual verbs. |
| `consultar/` | One noun lesson `consulta` → inquiry/query, explicitly retained for future `consultar / consulta` family audit. | No concepts or review candidates found. | Keep for future noun/verb-family audit or create small candidate batch if owner wants it included now. |
| `conocer/` | Only confusion-set files remain in source. | 16 concepts found in DB for `conocer`. | Treat as migrated concept family with retained contrast/pronunciation source. Do not delete unless contrast material is intentionally moved or represented elsewhere. |
| `deber/` | Only confusion-set files remain in source; empty old subfolders also remain. | 27 concepts found in DB. | Treat as migrated concept family with retained contrast/pronunciation source. Clean empty subfolders separately. |
| `detener/` | README has stop, arrest, detain, hold back; lesson has `detenerse para [hacer algo]` → stop to do something. | No matching concepts or review candidates found. | Create review batch. |
| `devolver/` | README has return, give back, refund, return a call. | DB has `devolver [algo]` → give back and `devolver [algo]` → take back from other audits; no refund/call-return coverage observed. | Reconcile partial coverage; add missing Spanish-first concepts/collections as needed. |
| `entregar/` | README has deliver, hand in, hand over, pronominal turn oneself in/surrender. | No matching concepts or review candidates found. | Create review batch. |
| `enviar/` | README has send, ship, forward, refer. | No matching concepts or review candidates found. | Create review batch. |
| `lograr/` | README plus normalized YAML mapping for `lograr hacer algo` → manage to do something; README also mentions achieve, succeed in, secure, negative `no lograr` → can't seem to. | Only incidental `trabajar para [lograr algo]` concept found; no `lograr` family migration. | Create review batch; preserve normalized mapping ID if migrated. |
| `mantener/` | README has keep, maintain, support, hold. | DB has related `mantenerse...` / `mantener [algo] bajo` concepts from `seguir`/keep phrasal-verb audit, but not the Spanish-first family meanings. | Reconcile partial coverage; likely create Spanish-first review candidates for missing meanings. |
| `mirar/` | README and lesson teach look at/watch; confusion set distinguishes look at vs see. | No matching concepts or review candidates found. | Create review batch; retain confusion-set source until represented or deliberately moved. |
| `obtener/` | README has get/obtain, achieve results, make a profit, receive help. | No matching concepts or review candidates found. | Create review batch. |
| `ordenar/` | README has order coffee, order/tell someone to, sort, tidy. | DB has only `ordenarle salir a [alguien]` → order [somebody] out from `pedir`/order audit. | Reconcile partial coverage; add missing Spanish-first meanings. |
| `pensar/` | Only pronunciation/confusion-set file remains. | 13 concepts found in DB. | Treat as migrated concept family with retained pronunciation contrast. |
| `postular/` | README has `postularse a` → apply for and noun `postulación` → application. | No matching `postular` concepts found; one unrelated review text hit from the word `postular` appearing in rationale/source text. | Create review batch or include with noun/verb-family residuals. |
| `regresar/` | README and lesson teach return, come back, go back; note says overlapping `volver` mappings are represented in DB. | No `regresar` concepts found. | Decide whether `regresar` should be its own Spanish-first family or only a source alias/collection on `volver` mappings; likely needs owner decision. |
| `solicitar/` | README has request, apply for, noun `solicitud` → request/application. | No matching concepts or review candidates found. | Create review batch or include with formal request/application family. |

## Empty leftover directories observed

`find docs/curriculum/mappings/spanish-to-english -type d -empty` currently reports 81 empty directories. Notable examples include:

- consumed top-level verb folders: `abrir`, `acabar`, `alcanzar`, `caer`, `contar`, `costar`, `echar`, `mandar`, `parar`, `parecer`, `pasar`, `perder`, `pesar`, `poder`, `preguntar`, `prestar`, `quedar`, `quitar`
- moved nested future-family placeholders: `conseguir/lograr`, `conseguir/obtener`, `tener/mantener`, `ver/mirar`, `volver/devolver`, `volver/regresar`
- many empty `tener/` form-family directories left after source consumption

These should be handled in the next cleanup phase, not during this audit report.

## Recommended next sequence

1. Owner confirms whether residual live folders should be migrated before pronouns/connectors.
2. Classify each file-bearing folder as `unmigrated-create-review-batch`, `partially-migrated-reconcile`, `retained-contrast-source`, or `future-family-retain`.
3. Delete empty leftover directories after confirming they are not intentionally used as placeholders.
4. Generate one or more review batches for the residual unmigrated/partial families.
5. Migrate approved concepts transactionally and run DB verification/tests.
