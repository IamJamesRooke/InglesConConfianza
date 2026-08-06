# Layer-One Migration Preservation Audit

This checkpoint records whether the folder collation filtered out source material.

| Check | Result |
|---|---:|
| Markdown files across the three original source folders | 158 |
| Original files preserved byte-for-byte in the canonical folder | 146 |
| Original navigation or index files rebuilt | 12 |
| Original lesson bodies omitted or rewritten | 0 |
| Markdown files in the canonical folder after collation and additions | 186 |

The 12 rebuilt files are all READMEs or indexes. Their links changed because their lessons moved, and the complete index gained missing modern coverage. Their organizing explanations remain in [preserved source overviews](source-overviews/README.md).

The 146 exact matches include every original lesson body, sentence set, contrast, table, and pronunciation lesson. This gives the first pass two independent safeguards:

1. **Migration preservation:** every original lesson body remains unchanged somewhere in the canonical tree.
2. **Coverage validation:** the [modern coverage audit](modern-coverage-audit.md) checks whether the original source itself omitted a form.

This audit is a layer-one checkpoint, not permission to delete overlapping lessons during later polishing.
