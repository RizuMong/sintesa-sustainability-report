# Sustainability Reporting Portal (Module 2) — Open Gaps

Companion to `docs/sustainability-reporting-portal-implementation-plan.md`. All 9 streams (A–I) are
merged into `main`; `pnpm build` passes and every `*.check.ts` passes. This file lists what is
**not** proven, because the streams built in isolated worktrees with no `node_modules`, no running
backend, and no pixel-hub MCP.

Nothing below is a known bug. Each item is something asserted-but-unverified, or deliberately
deferred, plus exactly how to settle it.

Severity: **P1** = wrong behaviour reaches a user if the assumption is wrong. **P2** = breaks on a
real backend. **P3** = cleanup / correctness debt.

---

## G1 · `flow_status: "sent"` is not in the type union — P1

**What.** `SubmissionFlowStatus` is locked to `'draft' | 'submitted' | 'approved' | 'rejected' |
'cancelled'`, but the real API returns `"sent"`.

**Where.**
- Union: `src/services/evaluate-gri-quantitative/types.d.ts:4`
- Workaround: `src/services/evaluate-gri-quantitative/validation.ts:28` — `isReadOnly()` treats
  anything that is not `draft`/`rejected` as locked, so `"sent"` locks the form by accident, not by
  design.
- Proof in the contract: `api/Evaluate GRI - Quantitative/Submit.yml:125` and
  `Index Approval.yml:155`.

**Why it matters.** Every status→badge map and every `flow_status === 'submitted'` comparison in
Streams C/D/E/F is written against a value the backend may never send. Badges fall through to a
default; approval-tab filters may show an empty queue against real data.

**How to verify.** Ask the backend team for the complete `flow_status` enum. Then:
```bash
grep -rn "flow_status ===\|SubmissionFlowStatus" src/services src/pages
```
Every hit must handle every real value. Widen the union in one place (`types.d.ts:4`) and let
`vue-tsc` find the non-exhaustive comparisons.

**Do not** just add `'sent'` to the union without asking — if `sent` *replaces* `submitted`, the
bulk-approve selector (`src/lib/review-approval-validation.ts`, `selectableApprovalIds`) selects
nothing, and AC-62 silently does nothing.

---

## G2 · `strategic-insight` response types are invented — P1

**What.** Plan §2.4 lists the three dashboard endpoints as "confirmed". They are not. The Bruno
files pin only `method` + `url`, with `body: { data: "{}" }` and **no example response**.

**Where.**
- `api/Dashboard/SDG.yml`, `GRI - Quantitative.yml`, `GRI - Qualitative.yml` (22 lines each, no
  response block)
- Invented shapes: `src/services/strategic-insight/types.d.ts`
- Consumers: `src/pages/dashboard/{SdgPage,GriQuantitativePage,GriQualitativePage}.vue`

**Why it matters.** All three dashboards will render empty or throw on first contact with the real
API if the field names differ. `aggregate.ts` is pure and tested, but it is tested against the
invented shape.

**How to verify.** Call each endpoint against a real environment:
```bash
curl -H "Authorization: $TOKEN" "$BASE_URL/v1/strategic-insight/sdg" | jq .
```
Diff the actual payload against `src/services/strategic-insight/types.d.ts`. Update the types, then
re-run `node --experimental-strip-types src/services/strategic-insight/api.check.ts` — the
sum/average branches (AC-75) must still hold on the real field names.

---

## G3 · `MpTabs` renders but its props/slots are unverified — P2

**What.** `MpTabs`, `MpTabList`, `MpTab`, `MpTabPanels`, `MpTabPanel` **do all exist** in
`@mekari/pixel3` (confirmed against `node_modules/@mekari/pixel3/dist/index.js`), and the 3-tab
review page typechecks. What is unverified is whether the default no-prop usage actually renders
and switches tabs.

**Where.** `src/pages/evaluate-gri-quantitative/ApprovalPage.vue:22-27`

**Related inconsistency.** Stream G refused to guess and built its 8 GRI-Quantitative tabs from
`MpButtonGroup` instead: `src/pages/dashboard/GriQuantitativePage.vue:28-31`. So the app has two
different tab mechanics on two screens.

**How to verify.**
```bash
pnpm dev
```
Open `/evaluate-gri-quantitative/approval` (or the `/review-approval` alias) and click through all
3 tabs. Then open `/dashboard` GRI-Quantitative and compare. Use the pixel-hub MCP `get-block` /
`get-component` on `Tabs` to confirm the intended API, and pick one mechanism for both screens.

---

## G4 · Evidence files are validated but never uploaded — P1

**What.** File type/size validation works and gates the Submit button. The file itself goes
nowhere — there is no upload endpoint in any confirmed contract.

**Where.**
- `src/pages/evaluate-gri-quantitative/DetailPage.vue` (`ponytail:` — no confirmed upload endpoint
  in `api/Evaluate GRI - Quantitative/*.yml`)
- `src/pages/report-plan-realization/DetailPage.vue` — sends the **filename** as a stand-in for
  `evidence_url`, and uses a native `<input type="file">` because the codebase has no Mp uploader
- Validation itself (correct, tested): `src/lib/dynamic-validation.ts`, `isAllowedEvidenceFile`

**Why it matters.** AC gates submission on evidence being attached. Today a user attaches a file,
Submit unlocks, the record saves — and the evidence is lost. This looks like it works.

**How to verify.** Confirm with backend whether evidence upload is multipart on the existing
create/update call or a separate endpoint. Until then treat `evidence_url` on any submitted record
as unpopulated:
```bash
grep -rn "evidence_url\|isAllowedEvidenceFile" src/
```

---

## G5 · `report-plan-realization` approval endpoints are mine, not a stream's — P2

**What.** Stream E's Tab 3 needed approve/reject/approval-index on `report-plan-realization`.
Stream F never built them (its brief did not list them). I added them during the E merge, mirroring
the confirmed quantitative shape.

**Where.** `src/services/report-plan-realization/api.ts` — `getApprovalList`,
`approveReportPlanRealization`, `rejectReportPlanRealization`, all marked `// ponytail: unconfirmed
contract`. Composables in the same module.

**Why it matters.** These three paths (`/v1/report-plan-realization/{approval/index,approve,reject}`)
were never in any FSD section or Bruno file. They are a convention guess with no review behind them.

**How to verify.** Confirm the paths exist. If Action Plan Realization approval is served by a
different module entirely, Tab 3 is pointed at the wrong place.

---

## G6 · Approve/reject payload standardised on `remarks` by fiat — P2

**What.** Three streams produced three shapes: C `{id, remarks}` (from the confirmed contract),
D `approve(id: string)` + `{id, notes}`, F `{id, notes}`. I standardised all of them on C's
`{id, remarks}` to make `ApprovalReviewTable` typecheck.

**Where.** `src/services/evaluate-gri-qualitative/api.ts`,
`src/services/report-plan-realization/api.ts`, consumed by
`src/components/ApprovalReviewTable.vue`.

**Why it matters.** `remarks` is correct for GRI-Quantitative (confirmed). For the other two modules
it is inherited, not verified — if their real field is `notes`, reject reasons silently never
persist, which defeats AC-60/66.

**How to verify.** `grep -rn "remarks" src/services/` — for each module without a Bruno contract,
confirm the field name before going live.

---

## G7 · Module 1 stubs are stale and still wired in — P3

**What.** Three stub files say "until Stream B / Stream C merges". Those modules landed in Module 1
(commit `f93b200`) and exist now. The stubs were never swapped.

**Where.**
- `src/lib/entity-stub.ts` → used by `src/pages/master-position/{DetailPage,ListPage}.vue`,
  `src/pages/master-employee/DetailPage.vue`
- `src/pages/workflow-configuration/masterEntityStub.ts` → used by that folder's
  `{DetailPage,ListPage}.vue`
- `src/pages/workflow-configuration/masterEmployeeStub.ts` → used by `DetailPage.vue`

Real modules that should replace them: `src/services/master-entity`, `src/services/master-employee`.

**Why it matters.** Those screens are showing stub data, not API data. This is Module 1 debt
surfaced by the Module 2 audit, not caused by it.

**How to verify.** Swap each import for the real composable (`useGetMasterEntity()`,
`useGetMasterEmployee()`), delete the three stub files, then:
```bash
pnpm build && grep -rn "Stub" src/pages src/lib
```

---

## G8 · Unconfirmed REST contracts across 8 modules — P2

Every module below guesses its endpoints from the sibling convention
(`/v1/<module>/{index,detail,create,update,delete}`) because no Bruno collection exists. All are
marked `// ponytail: unconfirmed contract`.

| Module | File |
|---|---|
| `sdg-adoption` | `src/services/sdg-adoption/api.ts` |
| `sdg-framework` | `src/services/sdg-framework/api.ts` |
| `evaluate-gri-qualitative` | `src/services/evaluate-gri-qualitative/api.ts` (9 methods) |
| `action-plan-submission` | `src/services/action-plan-submission/api.ts` |
| `report-plan-realization` | `src/services/report-plan-realization/api.ts` |
| `initiate-new-plan` | `src/services/initiate-new-plan/api.ts` |
| `action-plan-change-request` | `src/services/action-plan-change-request/api.ts` |
| `performance-tracking`, `data-export` | `src/services/{performance-tracking,data-export}/api.ts` |
| `gri-release` (detail/create/update/publish; only `index` confirmed) | `src/services/gri-release/api.ts` |

**How to verify.** As each Bruno folder lands in `api/`, diff it against the module's `api.ts`:
```bash
ls api/                                  # what contracts exist now
grep -rn "ponytail: unconfirmed" src/services/
```

---

## G9 · Smaller assumptions worth a second look — P3

| # | Assumption | Where |
|---|---|---|
| a | `GRI_QUANT` evidence defaults to `'Optional'` — `master-key-indicator-quantitative` has **no** `evidence_attachment` field, so AC-39's "auto-fill read-only from the MKI record" fills a default instead of real data | `src/pages/gri-quantitative/DetailPage.vue` |
| b | Investment Impact is treated as auto-eligible when `is_applied_to_all_entity` is true — the ACs never state the All-Entities case | `src/services/sdg-framework/validation.ts` |
| c | Investment-impact entity list hardcoded `['SDS','SBG','MEPPO']` — no admin screen exists (this one is per plan §5-B) | `src/services/sdg-framework/validation.ts` |
| d | Unverified badge gates on `unverified` alone, not the §4 compound `created_by_level === 'Subsidiary' && unverified` — the plan's own `TrackingRow` type has no `created_by_level` field | `src/services/performance-tracking/types.d.ts` |
| e | Origin Entity is a manual picker — `useOfficelessAuth` exposes no session-derived "current entity" | `src/pages/initiate-new-plan/DetailPage.vue` |
| f | GRI_QUAL template picker is a raw "Template ID" text input; Stream A's `gri-release` is now merged and should back it with a real select | `src/pages/gri-qualitative/ListPage.vue` |
| g | PDF/Excel export buttons call an unconfirmed `/export?format=pdf\|xlsx` endpoint | `src/pages/{action-plan-submission,initiate-new-plan}/DetailPage.vue` |

---

## G10 · `skipLibCheck` hides duplicate globals — P3 (process)

**What.** `skipLibCheck: true` is inherited from `@vue/tsconfig/tsconfig.json:63`. It suppresses
duplicate-identifier errors **inside `.d.ts` files** — so two streams declaring the same
`declare global` type produces **zero** typecheck errors.

This actually happened: Streams A and D both declared `GriQualAnswerMode`. Caught by the plan's
§6.4 grep, not by `vue-tsc`. Fixed in the Stream G merge commit (`gri-release` owns it now).

**How to verify — run this after any future merge, it is the only thing that catches this:**
```bash
grep -rhoE "^\s{2,4}(interface|type) [A-Za-z0-9_]+" src/services/*/types.d.ts \
  | awk '{print $2}' | sort | uniq -d
```
Empty output = clean. Any name printed = two modules own the same global.

---

## Standing verification sweep

Run all of it after any merge into `main`:

```bash
pnpm build                                          # typecheck + build

for f in $(git ls-files '*.check.ts'); do           # every check
  node --experimental-strip-types "$f" >/dev/null 2>&1 \
    && echo "ok   $f" || echo "FAIL $f"
done

grep -rhoE "^\s{2,4}(interface|type) [A-Za-z0-9_]+" src/services/*/types.d.ts \
  | awk '{print $2}' | sort | uniq -d                # G10: duplicate globals

grep -rn "ponytail:" src/ | wc -l                    # deferred-work count, should trend down
```

Known standing failure: `src/composables/useOfficelessAuth.check.ts` fails against uncommitted
local work in `src/composables/useOfficelessAuth.ts` (baseURL gains a `/<company_id>` suffix;
the check at line 12 expects the bare host). Unrelated to Module 2.

`nextTheme` route boundary is currently clean — 52 routes, 20 `/detail` routes, all with
`meta: { nextTheme: true }`, no list route carrying it.
