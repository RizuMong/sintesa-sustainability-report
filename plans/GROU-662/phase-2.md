# Phase 2 — Refresh the as-built doc

**Goal** — Bring `docs/mki-quantitative.md` in line with GROU-662 so the next reader does not
"re-fix" an intentional removal.

**Files owned**
- `docs/mki-quantitative.md`

**Depends on** — none (write from `plan.md` + `phase-1.md`; do not wait for the code).

## Context

The doc is the feature's as-built record (CLAUDE.md: check for one before assuming a contract).
Three of its statements go stale with this ticket — all in §4.2, the Create/Edit screen section
(§4.1 List Screen is untouched by GROU-662, do not edit it):

- §2 "**No `status` field.**" — now half wrong: `V1/Create.yml` and `V2/Create.yml` request bodies
  do carry `"status"`. Still absent from both Update bodies and from the Index response.
- §4.2 header/status line — Status and Last Updated used to sit beside the page `h1`; they now live
  in the identity panel alongside Category/Code/Description, and Status is an editable custom-HTML
  pill toggle, not a read-only `MpBadge`.
- §4.2 "**Value / Metric Columns** — the `metrics[]` of the payload: header, input type, optional
  unit" and the "disables (but keeps visible) the per-metric unit picker" sentence — the per-metric
  Unit picker is removed from the UI (value still persisted for legacy records).
- §4.2 — the Indonesian control names quoted in prose ("Tambah Section", "Satuan (Unit)", "Tidak
  ada / Seragam / Per baris").

## Steps

1. Add a dated update banner at the top mirroring the existing `> **2026-08-28 update.**` style:
   `> **2026-09-14 update (GROU-662).**` plus a one-line summary of the six adjustments.
2. Rewrite the §2 status bullet: create sends `status`; update sends it as a placeholder (no contract
   field); Index does not answer it, so the value is not readable back and the UI still falls back to
   `Active` on load — the Status pill's own choice does not survive a reload once saved. Name that as
   the open backend gap.
3. Update §4.2's header description: Status (custom pill toggle) and Last Updated now render inside
   the identity panel, not beside the `h1`.
4. Update §4.2's Step 1 description: metric columns are header + input type only (`metric.unit`
   survives in the payload for legacy records, no longer editable in the UI); panel descriptions live
   in tooltips, not inline text; all control copy is English; the header Delete button is icon-only.
5. Tick the new work into §5's checklist.

## Acceptance

`docs/mki-quantitative.md` contains no stale claim about a metric-level unit picker, a read-only
header status badge, or a wholly absent `status` field, and quotes no Indonesian control names. Every
ticket item in `plan.md` is findable in the doc. §4.1 (List Screen) is unchanged.
