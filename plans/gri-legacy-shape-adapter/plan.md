# GRI Quantitative — the live shape IS current; adapt the FE to it

## Premise correction (read first)

`scripts/verify-api.ts` reported the live payload as "pre-migration" because it byte-matches the
collection example we named `Legacy Response (pre dimensions/labels)`. That label was our
inference, not a BE statement. **BE says this shape is current.** So the delta is ours to absorb,
not theirs to fix — with three exceptions that are genuinely absent data, not naming (see
"Still-real gaps").

Live shape, verified 2026-09-10 (`.temp/api-verify/2026-09-10T14-18-19-587Z/gri-unfiltered.json`):

```jsonc
{ "data": [ {
  "category": "GENERAL",                      // bare uppercase string, no id
  "summary": [ { "key": "total_employee", "name": "Total Karyawan",
                 "value": 8614, "unit_id": null, "aggregation": "SUM" } ],
  "items":   [ { "id": "123", "period": 2025,
                 "entity": { "id": "Ks6BgE75YiQ1", "code": "WS", "name": "Waskita Sintesa" },
                 "gri_code": "2-7a", "metric_name": "Employee Headcount",
                 "description": "Laki-laki", "value": 880,
                 "unit_id": null, "input_type": "NUMBER" } ]
} ] }
```

### Field-by-field delta

| Live | Our canonical type | Class |
|---|---|---|
| `category: "GENERAL"` | `category_id: Ref2` | **rename + lookup** |
| `summary[].unit_id`, `items[].unit_id` | `unit: Ref2 \| null` | **pure rename** |
| — | `gri_codes: string[]` | **derivable** from `items[].gri_code` |
| — | `sequence: number` | **derivable** from category order |
| — | `items[].metric_key` | **derivable** from `metric_name` |
| `description: "Laki-laki"` | `labels: {gender:"MALE"}` + `dimensions[]` | **derivable via vocabulary** |
| — | `items[].aggregation` | **NOT derivable** — see G1 |
| 2 categories / 8 items | 8 categories | **missing data** — G2 |
| filters ignored (4/4 probes byte-identical) | A4 scope rule | **missing behaviour** — G3 |

## Decision: adapt at the boundary, do not rewrite downstream

One new module, `src/services/strategic-insight/normalize.ts`, converts the wire shape into the
canonical `StrategicInsightGriCategory[]` that `aggregate.ts`, `chart-spec.ts`, `tab-index.ts` and
`GriQuantitativePage.vue` already consume. Reasons:

1. `chart-spec.ts` (565 lines, 27 cards, 18 dimensions) and its two checks are correct against the
   canonical shape and were validated by a real browser run. Rewriting them to group on
   `description` re-introduces gap A2 (localized free text as a grouping key) — the exact bug the
   labels model exists to prevent.
2. Types keep describing one shape, so the page has no branching.
3. When BE adds `labels{}`/`dimensions[]` natively, the adapter's derivation step becomes a
   pass-through and gets deleted. Nothing else changes.

Two named types instead of one:

- `StrategicInsightGriWireCategory` — exactly what the endpoint sends today.
- `StrategicInsightGriCategory` — unchanged canonical shape the UI consumes.

`api.ts` returns the canonical one; `normalize.ts` is the only place that knows the wire shape.

## Phases

Each phase is independently committable and has its own `*.check.ts`. Run
`node --experimental-strip-types <file>` per the header of each check.

### Phase 1 — wire types + the two pure renames + derivations

- Add `StrategicInsightGriWire*` interfaces to `types.d.ts` (`category: string`,
  `unit_id: Ref2 | null`, no `labels`/`dimensions`/`aggregation` on items, no
  `gri_codes`/`sequence`).
- `normalize.ts` exports `normalizeGriQuantitative(wire, opts?)`:
  - `unit_id` → `unit` (both on `summary[]` and `items[]`);
  - `category: "GENERAL"` → `category_id: {id, name}` — id resolved from a
    `CATEGORY_SLUGS` table mapping the uppercase token to the canonical display name
    (`GENERAL`→`General`, `DIVERSITY`→`Diversity & Equal Opportunity`, …, all 8). Unknown token
    passes through as `{ id: token, name: titleCase(token) }` so a new category renders as a tab
    instead of vanishing;
  - `gri_codes` = unique `items[].gri_code` **trimmed to their tab root** (`'2-7a'`→`'2-7'`,
    `'302-1a'`→`'302-1'`), in first-seen order. This is what `resolveTab()` in `chart-spec.ts`
    matches on, so getting it wrong silently drops every tab to the generic renderer;
  - `sequence` = the category's index in the response +1, unless a `sequence` is already present.
- `normalize.check.ts`: feed the **real** live dump (commit a redacted copy as
  `src/services/strategic-insight/fixtures/live-gri-quantitative.json`, generated from
  `.temp/api-verify/*/gri-unfiltered.json`) and assert: 2 categories, `category_id.name` is
  `General`/`Energy`, `gri_codes` are `['2-7','2-2','2-3','2-23']`/`['302-1']`, every `unit_id` is
  gone and `unit` present, `resolveTab()` returns `general`/`energy`.

### Phase 2 — description → labels, via a declared vocabulary

- In `normalize.ts`, add `DIMENSION_VOCABULARY`: per category token, a list of
  `{ dimension, member, name, aliases[] }`. Seeded from the wire's actual `description` values and
  the mockup's members. Must include the `Perempuan`/`Wanita` synonym pair the gap doc calls out.
- Derivation: for each item, match `description` (case- and accent-insensitive, trimmed) against
  the vocabulary → `labels[dimension] = member`. `dimensions[]` is then built per category from the
  members **actually observed**, in vocabulary-declared order (never object key order — chart
  series order must be stable across refetches).
- Unmatched `description` on a numeric item: leave `labels` empty and push onto a returned
  `warnings: string[]`. Do not invent a member. An item with no labels is excluded from dimension
  series by `itemsAt()` already, so the chart drops rather than lying.
- `metric_key` = slug of `metric_name` (`'Employee Headcount'`→`'employee_headcount'`), which is
  exactly the convention `chart-spec.ts`'s `byMetric()` calls already assume — verify each
  `byMetric` key in `chart-spec.ts` against the slugs this produces and record any that cannot be
  satisfied by the current 8 items (most cannot yet; that is G2, not a bug here).
- Extend `normalize.check.ts`: `Laki-laki`→`{gender:'MALE'}`, `Perempuan`→`{gender:'FEMALE'}`,
  `Non-Renewable`→`{renewability:'NON_RENEWABLE'}`, `Renewable`→`{renewability:'RENEWABLE'}`,
  `Manajerial` unmatched → warning, and that `seriesByDimension(general,'gender')` yields two
  non-empty series from the real fixture. Add a mutation test per rule (flip one alias, assert the
  check fails) — same discipline as `gri-contract-diff.check.ts`.

### Phase 3 — `aggregation` on items (G1), stated not guessed

`items[].aggregation` is absent from the wire and **cannot** be inferred from `input_type`: salary
ratios and average training hours are `NUMBER` yet must AVERAGE. Summing them produced the visible
"1.88 ratio" and "~450 average hours" bugs. So:

- `AVERAGE_METRIC_KEYS` — an explicit, commented allow-list in `normalize.ts`
  (`salary_ratio_female_to_male`, `avg_training_hours`, plus any `metric_key` whose
  `input_type === 'PERCENTAGE'`). Everything else `SUM`.
- One `ponytail:` comment stating this is an FE-side stand-in for a BE field, with the removal
  condition: delete the table the day `items[].aggregation` arrives on the wire.
- Check: a fixture item with `input_type: 'PERCENTAGE'` and two entities does not double.

### Phase 4 — wire the adapter in, and make the harness measure the right thing

- `api.ts`: `getGriQuantitativeInsight` unwraps `StrategicInsightGriWireCategory[]` then returns
  `normalizeGriQuantitative(...)`. Page, composables and `chart-spec.ts` untouched.
- `scripts/lib/gri-contract-diff.ts`: run the shape/enum rules against the **normalized** payload,
  and re-classify the naming findings. `SHAPE_MISSING_CATEGORY_ID`, `SHAPE_MISSING_GRI_CODES`,
  `SHAPE_MISSING_SEQUENCE`, `SHAPE_MISSING_DIMENSIONS` must stop being `error`: they are now
  either satisfied by the adapter or reported as `warning` with the adapter named as the absorber.
  Keep `error` only for the still-real gaps below. Update the HEADLINE text — it currently asserts
  "has NOT been migrated", which is the wrong conclusion.
- Keep every existing mutation test in `gri-contract-diff.check.ts` green; add ones pinning the
  new severities.
- `mock-api-server.ts` should serve the **wire** example (add a wire fixture / keep replaying the
  legacy example) so `run-dashboard-acceptance.sh` exercises the adapter, not around it. That
  browser run is the only proof the page renders; it must go through the real path.
- Re-run, in this order: every `strategic-insight/*.check.ts`, `scripts/lib/*.check.ts`,
  `pnpm build`, `bash scripts/run-dashboard-acceptance.sh`, then
  `node --experimental-strip-types scripts/verify-api.ts`.

### Phase 5 — documentation, so the wrong premise is not re-derived

- `docs/dashboard-gri-quantitative-api-gaps.md`: rewrite the "Live-backend status" block. State
  that the live shape is current per BE, that A1/A2/A5 are absorbed FE-side by `normalize.ts`, and
  demote them from blockers to "absorbed, with a cost".
- Rename the collection example `Legacy Response (pre dimensions/labels)` → `Response (current
  BE shape)` in `api/Dashboard/GRI - Quantitative.yml`, and re-point every code comment and loader
  that names it (`grep -rn "Legacy Response"`). This misleading name is the root cause of the
  wrong conclusion. Note: `api/` is a symlink to the sibling collection repo — commit there
  separately, and if it is not writable, stop and report rather than editing around it.
- `CLAUDE.md`: replace the "As of 2026-09-10 this run FAILS, and that is a true result" paragraph
  with the corrected reading and the adapter's location.

## Still-real gaps (do NOT paper over these)

- **G1** `items[].aggregation` missing → Phase 3 allow-list is a guess in a trench coat. Correct
  values still need a BE field or a written per-metric rule.
- **G2** 2 of 8 categories, 8 items, one entity, one period. Six tabs render nothing regardless of
  FE work. Trend charts need ≥2 periods; the PT-comparison chart needs ≥2 entities.
- **G3** `period` / `entity_id` / `category_id` accepted and ignored (4/4 probes byte-identical).
  The A4 scope question is unanswerable until filtering exists. `verify-api.ts` must keep reporting
  this as an error.

`verify-api.ts` should therefore still exit non-zero after all 5 phases — but for 3 real reasons
instead of 8 naming symptoms.

## Constraints

- pnpm only. No new dependencies.
- No `*.check.ts` weakened to pass. If a check fails, either the code or the check's premise is
  wrong — say which.
- Preserve `ponytail:` comments; add them for the two deliberate stand-ins (category id table,
  aggregation allow-list).
- Commit per phase, message explaining *why* in the style of `git log` here (see `c10f5cf`).
