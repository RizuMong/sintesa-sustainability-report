# Phase 4 — As-Built docs

**Depends on:** phases 2 and 3

## Goal

`docs/<feature>.md` is where this repo records deliberate deviations from a spec. Two of them land
in this ticket and neither is visible from the code alone.

## Files owned

- `docs/mki-quantitative.md`
- `docs/evaluate-quantitative.md`

## Steps

1. `docs/mki-quantitative.md` — add a section covering:
   - Sections are **flat marker rows** (`type: 'SECTION'`), not a nested `children[]`. Why: one
     array keeps drag-reorder, sequence identity and both render paths one-dimensional; the ticket's
     reference design is a visual grouping, not a data hierarchy. Consequence, stated plainly:
     deleting a section header does not delete its rows.
   - `sequence` is an identity, not an order. Array order is the display order. Rows keep the
     sequence they loaded with; new ones take `max + 1`. Why: evaluate's `row_key` is derived from
     it, so restamping (which is what the code did before this ticket) repoints every submitted
     value.
   - The unit precedence chain and why the legacy metric-level unit is the last term rather than
     being migrated away: it is what makes pre-ticket indicators keep rendering unchanged.

2. `docs/evaluate-quantitative.md` — note that the matrix now skips sections on save
   (`dataRows`) and takes its unit from `resolveUnit`, and that `toSubmissionValue`'s 4th argument
   defaults to the metric unit specifically so old call sites and old data stay correct.

3. Record BE questions 1-4 from `plan.md` with whatever answers came back during the build, and
   delete the ones that turned into code. An unanswered question stays in the doc as an open gap —
   `docs/sustainability-reporting-portal-open-gaps.md` is the existing home for that pattern if it
   is better placed there.

## Acceptance

Both docs mention `unit_mode` and `SECTION`. No code changes in this phase.
