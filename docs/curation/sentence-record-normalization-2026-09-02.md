# Sentence-record normalization, 2026-09-02

## What these records are

A group of curriculum concepts stored a complete Spanish sentence in the `spanish`
field and repeated it verbatim in `example_spanish`, with the English translation
repeated the same way. They are the residue of a Spanish-word-indexed source tree:
each source document answered "what does *además* become in English?" and illustrated
the answer with a sentence. The migration stored the illustration and lost the answer.

Every affected record carries a `spanish-to-english catchall` collection plus a
collection naming the Spanish function word it was filed under, and each one still had
recoverable provenance in the review-candidate rows that the concept-id reslug migration
had populated (those rows have since been dropped with the review pipeline). Those source
paths named the teaching target directly — `apenas/10-hardly-wait.md`,
`mismo/07-by-oneself.md`, `entre/05-the-more.md` — which is what makes the normalization
determinable rather than invented.

The retired source trees no longer exist on disk, so this document is the source of
record for the batch. The original provenance path for each concept is preserved below.

## What the normalization does

Per the project rule that a concept must teach the reusable construction rather than one
inflected instance of it, each record is rewritten so that:

- `spanish` / `english` hold the construction the sentence illustrates;
- `example_spanish` / `example_english` keep the original sentence unchanged.

The 74 rewrites in this document were applied directly via
`curriculum:concepts:apply`. Records whose construction is already held by another
concept were moved to `trash` instead of rewritten.

Two bundled rows are split into one teachable unit per row, per the one-entry-per-row
rule. `etyzwht0ts` becomes `no solo [algo]` and the previously bundled
`zn6dojvjv8` is taken over for the other half, `sino también [algo]`, so the split
produces no new rows.

Two rows also had bundled content inside a single field, and the normalization keeps
only the half that is not already covered elsewhere:

- `eyue78cz5h` bundled `de noche` and `de vez en cuando`; `por la noche -> at night`
  already exists, so the row becomes `de vez en cuando -> from time to time`.
- `0lold5fh3d` had `whenever/as long as` in one English field; it becomes the
  `as long as` sense, and `t114homehd` carries the `whenever` sense.

## Records this pass deliberately leaves alone

Rows matching the sentence shape only because they end in `?` while already holding real
placeholders and a distinct example — `¿cuánto hace que [ocurre algo]?`,
`¿[alguien] tiene que [hacer algo]?`, and the other question frames — are correct
concepts and were not touched.

## Provenance

| Concept | Original source path |
|---|---|
| zeorvyamau | mappings/spanish-to-english/adelante/README.md |
| zzy7poh40i, wmmatrxzh1, fzg570rb5k | mappings/spanish-to-english/ademas/README.md |
| xymr8kc90t | mappings/spanish-to-english/antes/ante (before, faced with, in front of, above all).md |
| 9gk6xesysy | mappings/spanish-to-english/apenas/06-hardly-context.md |
| 45izdwmxbd | mappings/spanish-to-english/apenas/10-hardly-wait.md |
| yv5pwer3eq | mappings/spanish-to-english/asi/README.md |
| mhy4vnhbw9, 8a3s9ew4ih | mappings/spanish-to-english/atras/README.md |
| gw00aci88b, dakptjtohz | mappings/spanish-to-english/bastante/bastar/README.md |
| g9lxdgb2ld | mappings/spanish-to-english/bien/06-si-bien.md |
| 21gdf6imx4 | mappings/spanish-to-english/bien/07-bien-bien.md |
| 9zwpouaz61 | mappings/spanish-to-english/bueno/mejor/README.md |
| gaw97ecxke | mappings/spanish-to-english/cierto/README.md |
| kg63snjtds, xn3hhqqgv2, rey5kzco3o | mappings/spanish-to-english/con/02-con-que-and-con-quien.md |
| fwytkxeon9, 17mqfzfrq1 | mappings/spanish-to-english/cual/01-cual-which-and-what.md |
| lrfioq96ny | mappings/spanish-to-english/cuando/01-cuando-when.md |
| fnszz28inq | mappings/spanish-to-english/cuanto/01-cuanto-how-much-and-how-long.md |
| l0f7fdzag6 | mappings/spanish-to-english/cuanto/cuán (how).md |
| o4unfsl9d0, m2oepphsrg, 4icl1zhexf | mappings/spanish-to-english/de/confusion-sets/ |
| n19h8scdqx | mappings/spanish-to-english/de/core-translations/03-de-to-about.md |
| eyue78cz5h | mappings/spanish-to-english/de/fixed-expressions/01-time-expressions.md |
| 5rr4zebvp7 | mappings/spanish-to-english/de/fixed-expressions/03-cause-and-reaction.md |
| wine5n6gd9 | mappings/spanish-to-english/de/fixed-verb-connections/03-depender-de.md |
| 20iwl9s0r5, pwdq4vnqib | mappings/spanish-to-english/dentro/README.md |
| 0rg57o7g76, yhh3l4act9 | mappings/spanish-to-english/desde/README.md |
| 6827l0k1ob | mappings/spanish-to-english/despues/luego/04-desde-luego.md |
| cboe3ncvvg | mappings/spanish-to-english/donde/01-donde-where.md |
| v7psmvhjff | mappings/spanish-to-english/entre/05-the-more.md |
| 2yywyl5i44, uqw7qo48c9 | mappings/spanish-to-english/mas/03-more-than.md |
| 7nzdyaq2x1 | mappings/spanish-to-english/medio/README.md |
| 8g59ojfuw4 | mappings/spanish-to-english/menos/README.md |
| 7xx1fimdtn | mappings/spanish-to-english/mientras/02-whereas.md |
| 5r4vw18q4o | mappings/spanish-to-english/mismo/07-by-oneself.md |
| szn7fm8wsx | mappings/spanish-to-english/mucho/05-a-lot.md |
| 01slode9o8 | mappings/spanish-to-english/mucho/06-plenty-of.md |
| o2ms964cwz | mappings/spanish-to-english/mucho/README.md |
| dhyt13en8w | mappings/spanish-to-english/ni/01-nor.md |
| i4tdzuamg4 | mappings/spanish-to-english/ni/02-neither-nor.md |
| 52dbadce2l, v96gg2fw1q, 31la252ocl | mappings/spanish-to-english/ni/siquiera/README.md |
| 4sabms9mlz | mappings/spanish-to-english/nunca/README.md |
| dzhyd6xsd6 | mappings/spanish-to-english/por/09-por-que-why.md |
| i7kngch29y, lcz2539dyj, 0jle9bry8q | mappings/spanish-to-english/pronto/README.md |
| erzbzs0gzc | mappings/spanish-to-english/que/what-and-than.md |
| gwnpt7pmq9 | mappings/spanish-to-english/seguro/asegurar/README.md |
| etyzwht0ts | mappings/spanish-to-english/si/sino/02-but-also.md |
| ksf8aynt7s | mappings/spanish-to-english/si/sino/03-except.md |
| t114homehd, 0lold5fh3d | mappings/spanish-to-english/siempre/README.md |
| tpnbbxdlyr | mappings/spanish-to-english/sin/README.md |
| 6k3ek5jhqf | mappings/spanish-to-english/tanto/02-as-much-many-as.md |
| ub2iy1fuxk | mappings/spanish-to-english/tanto/03-meanwhile.md |
| 97h5zo76ab | mappings/spanish-to-english/tarde/README.md |
| 23jqqwk28f, vmo1fuguve | mappings/spanish-to-english/tarde/tardar/README.md |

All paths are relative to the retired `docs/curriculum/` tree, which remains available as
immutable provenance in the `mapping_source_documents` and `mapping_source_entries`
tables.
