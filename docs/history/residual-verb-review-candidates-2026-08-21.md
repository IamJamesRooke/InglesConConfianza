# Residual Spanish-First Verb Review Candidates

> Archived historical planning document. Its live-source assumptions were superseded by the 2026-08-23 full source capture; the original review state remains in PostgreSQL and immutable snapshots.

> Drafted from the residual-folder audit on 2026-08-21. These are proposed review candidates only; nothing here is migrated yet.

## Batch intent

Capture the remaining verb-family material that is still present in the source tree but not yet fully represented in PostgreSQL.

## Proposed candidates

### `acordar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| acordar [hacer algo] | to agree to [do something] | supporting | acordar, agree, infinitive construction |
| acordar [hacer algo] | to decide to [do something] | reference | acordar, decide, infinitive construction |
| acordar [algo] | to agree on [something] | supporting | acordar, agree on, noun/decision |
| acordarse de [algo] | to remember [something] | reference | acordar, remember, pronominal, de => of |
| acordarse de [hacer algo] | to remember doing [something] | reference | acordar, remember doing, pronominal, gerund |
| hacer acordar | to remind | reference | acordar, remind |
| no acordarse de [algo] | to can't remember [something] | reference | acordar, can't remember, negative |

### `aparecer`

| Spanish | English | Role | Collections |
|---|---|---|---|
| aparecer | to appear | supporting | aparecer, appear |
| aparecer | to show up | supporting | aparecer, show up |
| aparecer [en una lista] | to be listed | reference | aparecer, listed |
| aparecer [una publicación] | to come out | reference | aparecer, publish, come out |

### `buscar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| buscar [algo] | to look for [something] | core | buscar, look for |
| buscar a [alguien] | to want [somebody] for questioning | reference | buscar, official seeking |

### `detener`

| Spanish | English | Role | Collections |
|---|---|---|---|
| detener [algo] | to stop [something] | supporting | detener, stop |
| detener a [alguien] | to arrest [somebody] | reference | detener, arrest |
| detener a [alguien] | to detain [somebody] | reference | detener, detain |
| detener [algo/alguien] | to hold back [something/somebody] | reference | detener, hold back |
| detenerse para [hacer algo] | to stop to [do something] | reference | detener, stop to, infinitive construction |

### `entregar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| entregar [algo] | to deliver [something] | reference | entregar, deliver |
| entregar [algo] | to hand in [something] | reference | entregar, hand in |
| entregar [algo] a [alguien] | to hand [something] over to [somebody] | reference | entregar, hand over, a => to |
| entregarse | to turn oneself in | reference | entregar, surrender, pronominal |
| entregarse | to surrender | reference | entregar, surrender |

### `enviar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| enviar [algo] | to send [something] | core | enviar, send |
| enviar [algo] | to ship [something] | supporting | enviar, ship |
| enviar [algo] | to forward [something] | supporting | enviar, forward |
| enviar a [alguien] | to refer [somebody] | reference | enviar, refer |

### `lograr`

| Spanish | English | Role | Collections |
|---|---|---|---|
| lograr [hacer algo] | to manage to [do something] | reference | lograr, manage to, success expression |
| lograr [algo] | to achieve [something] | reference | lograr, achieve |
| lograr [algo] | to succeed in [something] | reference | lograr, succeed in |
| no lograr [hacer algo] | to can't seem to [do something] | reference | lograr, negative, can't seem to |

### `mirar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| mirar [algo] | to look at [something] | core | mirar, look at |
| mirar [algo] | to watch [something] | supporting | mirar, watch |

### `obtener`

| Spanish | English | Role | Collections |
|---|---|---|---|
| obtener [algo] | to get [something] | core | obtener, get |
| obtener [algo] | to obtain [something] | supporting | obtener, obtain |
| obtener [resultados] | to achieve [results] | reference | obtener, achieve |
| obtener [ganancia] | to make [a profit] | reference | obtener, make |
| obtener [ayuda] | to receive [help] | supporting | obtener, receive |

### `postular`

| Spanish | English | Role | Collections |
|---|---|---|---|
| postularse a [algo] | to apply for [something] | reference | postular, apply for, reflexive |
| postularse | to apply | reference | postular, apply |
| postulación | application | reference | postular, noun family |

### `solicitar`

| Spanish | English | Role | Collections |
|---|---|---|---|
| solicitar [algo] | to request [something] | core | solicitar, request |
| solicitar [algo] | to apply for [something] | supporting | solicitar, apply for |
| solicitud | request | reference | solicitar, noun family |
| solicitud | application | reference | solicitar, noun family |

## Partial-family reconciliation notes

### `devolver`

Already represented in PostgreSQL:

- `devolver [algo]` → `to take back [something]`
- `devolver [algo]` → `to give [something] back`

Still to review:

- `devolver [algo]` → `to refund [something]`
- `devolver [algo]` → `to return [something]`
- `devolver la llamada` → `to return a call`

### `mantener`

Already represented in PostgreSQL via downstream keep-style concepts, but the Spanish-first family still needs review for:

- `mantener [algo]` → `to keep [something]`
- `mantener [algo]` → `to maintain [something]`
- `mantener a [alguien]` → `to support [somebody]`
- `mantener [una ventaja]` → `to hold [the lead]`

### `ordenar`

Already represented in PostgreSQL for one order-out meaning, but still needs review for:

- `ordenar [algo]` → `to order [something]`
- `ordenar a [alguien] [hacer algo]` → `to tell/order [somebody] to [do something]`
- `ordenar [algo]` → `to sort [something]`
- `ordenar [algo]` → `to tidy [something]`

### `regresar`

Needs owner decision on whether it should remain a distinct Spanish-first family or be treated only as a retrieval path under `volver`.

Proposed if retained:

- `regresar` → `to come back`
- `regresar` → `to go back`
- `regresar` → `to return`

## Likely review-batch split

If imported in small batches, the cleanest split is probably:

1. `acordar` + `aparecer` + `buscar`
2. `detener` + `entregar` + `enviar`
3. `lograr` + `mirar` + `obtener`
4. `postular` + `solicitar`
5. reconciliation batch: `devolver` + `mantener` + `ordenar` + `regresar`

## Open questions for owner review

- Should `acordar` keep the memory meanings under the same family, or split them into an adjacent retained family?
- Should `buscar a [alguien]` stay Reference or be deleted if the course avoids official-seeking vocabulary?
- Should `postular` and `solicitar` stay as separate families, or should one own the other via collections?
- Should `regresar` be kept distinct from `volver`, or retired as a retrieval path?
