# Sustainability Reporting Portal (Module 2) — Implementation Plan

Source spec: `docs/fsd/sustainability-reporting-portal.md` (sections 2.1–2.14, AC-38 … AC-113).
Gap analysis vs `src/router/index.ts` as of 2026-08-24.
Companion plan for Module 1: `docs/platform-administrator-implementation-plan.md` (all 6 streams landed, commit `f93b200`).

Audience: sub-agents (Sonnet) executing one stream each, in parallel, in separate git worktrees.
**Read §1–§4 and your own stream section only. Do not read other streams' sections.**

---

## 1. Gap analysis

| FSD | Feature | Status today | Stream |
|---|---|---|---|
| 2.1 | GRI Management — annual template release (Quant + Qual) | Placeholder only: `/gri-quantitative` list+detail on a 2-record in-memory mock (`src/services/gri-quantitative.api.ts`). **To be replaced.** | A |
| 2.2 | SDG Adoption Management (17 UN goals, adopt flags) | Missing | B |
| 2.3 | SDG Framework (Parent SDG + Action Plan Matrix) | Missing | B |
| 2.4 | Review & Approval (3 tabs, entity-scoped routing) | Partial: `/evaluate-gri-quantitative/approval` exists on an in-memory mock, GRI-Quant only, no tabs | E (shell + tabs), C (quant data layer) |
| 2.5 | Action Plan Change Request — Approval (Holding) | Missing | E |
| 2.6 | Performance Tracking Dashboard | Missing | H |
| 2.7 | Strategic Insight Dashboard (SDG + GRI) | Stub charts with hardcoded arrays: `src/pages/dashboard/{SdgPage,GriQuantitativePage,GriQualitativePage}.vue`. **To be rewritten.** | G |
| 2.8 | Data Export & Report (CSV) | Missing | H |
| 2.9 | GRI Submission — Quantitative (Subsidiary) | Partial: `/evaluate-gri-quantitative/requestor` + detail, in-memory mock, static form | C |
| 2.10 | GRI Submission — Qualitative (Subsidiary) | Missing | D |
| 2.11 | Submit Action Plan — Take / Skip | Missing | F |
| 2.12 | Initiate New Plan (dual governance) | Missing | I |
| 2.13 | Action Plan Change Request (Subsidiary submit) | Missing | I |
| 2.14 | Report Plan Realization | Missing | F |

Module 1 modules that Module 2 consumes as lookups — **all already landed on `main`, import them, never re-declare their globals**:
`@/services/master-unit` (`MasterUnit`), `@/services/master-entity` (`MasterEntity`, `EntityType`, `MasterStatus`), `@/services/master-period` (`MasterPeriod`, `realization_window`), `@/services/master-pillar` (`MasterPillar`), `@/services/master-gri` (`MasterGri`), `@/services/master-position`, `@/services/master-employee`, `@/services/mki-sdg` (`MkiSdg`, `MkiInputType`, `MkiEvidenceAttachment`, `MkiCreatedByLevel`), `@/services/mki-gri-qualitative` (`MkiGriQualitative`, `MkiGriQualQuestion`, `MkiGriQualAnswerMode`), `@/services/workflow-configuration` (`WorkflowConfig`, `ApprovalType`), `@/services/periodic-notification`.

9 streams, all independent. Shared-file contention is limited to `src/router/index.ts` (additive only) — see §6.

---

## 2. Conventions — every stream must follow, no exceptions

### 2.1 Read these files first (and only these) before writing code

1. `CLAUDE.md` — repo rules.
2. `src/services/master-unit/{api,composables,types.d,validation,index}.ts` + `api.check.ts` — **the reference module. Copy its shape literally.**
3. `src/pages/master-gri/ListPage.vue` and `src/pages/master-gri/DetailPage.vue` — reference list/detail page pair.
4. `src/lib/http.ts` — `http` + `unwrap<T>()`.
5. Your stream's `api/` folder(s), if §2.4 says a contract exists.

Do not read all of `docs/fsd/sustainability-reporting-portal.md`; read only the section(s) your stream owns (the file is 638 lines, in Indonesian).

### 2.2 Service module shape (mandatory)

```
src/services/<module>/
  api.ts          // axios via src/lib/http.ts, one method per endpoint, unwrap<T>() the envelope
  composables.ts  // useQuery/useMutation wrapping api.ts; query key = ['<module>Api.<method>', ...params]
  types.d.ts      // declare global { ... } + `export {}` — no import needed by consumers
  validation.ts   // OPTIONAL: pure functions only (no '@/' imports) so *.check.ts can import them relatively
  index.ts        // export * from './api'; export * from './composables'
  api.check.ts    // node:assert/strict smoke test, header comment = exact run command
```

- Never use `createMockApi()` / `src/composables/useCrud.ts` — old shape, being phased out.
- Never add types to `src/types/index.ts` — it is being wound down.
- Never re-declare a global that already exists (`MasterStatus`, `MkiInputType`, `MasterEntity`, …). Grep `src/services/*/types.d.ts` first.

### 2.3 Pages

- `src/pages/<feature>/ListPage.vue` + `DetailPage.vue`, calling the module's composables directly.
- Route meta: **list routes get no `meta`** (2.1 theme); **detail/form routes get `meta: { nextTheme: true }`** (2.4 theme). 100% consistent across the codebase — no exceptions.
- Reuse, do not rebuild: `src/components/TableFilter.vue` + `src/composables/useTableFilter.ts` (list filtering), `src/components/ConfirmDeleteModal.vue` (destructive confirm), `src/components/SummaryBox.vue` (KPI tiles), `src/composables/useHistoryRecord.ts` (only if a detail page has no fetch-by-id endpoint).
- Loading = `MpSkeleton` rows; empty = the `MpImage` blank-slate illustration used in `src/pages/master-gri/ListPage.vue`. Copy those blocks verbatim.
- Before writing any `Mp*` markup: pixel-hub MCP `get-block` (look for an existing block first), `get-component` (verify props/slots), `get-icon-name` (never invent icon names). Load `.agents/skills/pixel/SKILL.md`.
- Inline the status→badge ternary/map per page like every existing page does. Do not build a shared badge util.

### 2.4 Backend contracts

Real REST, envelope `{code, data, error, message}`, header `Authorization: {{token}}` (raw, no `Bearer`), base `{{base_url}}/v1/...`. `http.ts` handles auth + envelope; `unwrap<T>()` returns `.data.data`.

Confirmed contracts in `api/` (Bruno, symlinked, gitignored):

| Path | Methods | Used by |
|---|---|---|
| `/v1/master-template-quantitative/index` | GET | Stream A |
| `/v1/evaluate-gri-quantitative/index?entity_id&period&template_id` | GET (requestor list) | C |
| `/v1/evaluate-gri-quantitative/approval/index` | GET (approver queue) | C, E |
| `/v1/evaluate-gri-quantitative/detail?id=` | GET | C, E |
| `/v1/evaluate-gri-quantitative/{create,update,submit,cancel,approve,reject}` | POST | C, E |
| `/v1/evaluate-gri-quantitative/delete?id=` | DELETE | C |
| `/v1/strategic-insight/{sdg,gri-quantitative,gri-qualitative}` | GET | G |

**Everything else has no contract yet.** Where missing: follow the sibling convention `{{base_url}}/v1/<module-kebab-case>/index|detail|create|update|delete`, and mark the guessed method with a `// ponytail: unconfirmed contract — ...` comment. Do not invent an unrelated shape, do not block on backend coordination, do not build an in-memory mock instead.

### 2.5 Checks

Every new `api.ts` ships one `api.check.ts` (plain `node:assert/strict`, no framework). Put the pure logic it tests in `validation.ts` and import it with a **relative `./validation.ts` path** (Node cannot resolve `@/`). Header comment must be the exact run command, e.g.:
`// run: node --experimental-strip-types src/services/<module>/api.check.ts`
Cover at minimum the stream's stated validation rules + any state-transition guard. Never hit the network in a check.

### 2.6 Scope discipline

- No abstraction with one caller. No generic "form engine" framework — build the one form the section describes.
- Simulated/absent backend behavior (auto-distribution on publish, real-time refresh, PDF/Excel generation, audit-log persistence) gets a `// ponytail:` comment naming the ceiling and the upgrade path, not a hand-rolled implementation.
- Indonesian FSD, but **UI copy follows what neighbouring pages already do**: Indonesian labels where existing pages use Indonesian, English otherwise. Match the sibling page you copied.

---

## 3. Cross-cutting type contracts

Types live per-module (`declare global`), so there is **no file contention** — but two streams must not declare the *same* global name. The shapes below are fixed here so a consuming stream can code against exact field names before the owning stream merges.

```ts
// OWNED BY STREAM C — src/services/evaluate-gri-quantitative/types.d.ts
// (verbatim from api/Evaluate GRI - Quantitative/Detail.yml — do not change field names)
declare global {
  type SubmissionFlowStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled'
  type ApprovalAction = 'PENDING' | 'APPROVED' | 'REJECTED'
  type ApprovalStageStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED'
  interface Ref2 { id: string; name: string }            // the {id,name} pair the API returns for every FK

  interface ApprovalApprover {
    acted_at: number | null
    action: ApprovalAction
    notes: string | null
    position: Ref2
    user: { id: string; name: string; email: string }
  }
  interface ApprovalLog {
    approval_type: ApprovalType                          // reuse workflow-configuration's global
    approvers: ApprovalApprover[]
    decided_at?: number | null
    minimum_action: number
    request_id: string
    stage_order: number
    status: ApprovalStageStatus
  }
}
```

```ts
// OWNED BY STREAM B — src/services/sdg-adoption/types.d.ts
declare global {
  interface SdgGoal {
    id: string
    number: number                 // 1..17
    name: string
    icon_url: string
    adopted: boolean
    updated_at: string
    updated_by: string             // audit trail, AC-43
  }
}
// OWNED BY STREAM B — src/services/sdg-framework/types.d.ts
declare global {
  type SdgImpactType = 'Operation Impact' | 'Investment Impact'
  type CreatedByLevel = 'Holding' | 'Subsidiary'   // NOTE: mki-sdg already declares `MkiCreatedByLevel`; this is a second, differently-named alias — do not redeclare MkiCreatedByLevel

  interface ActionPlanMatrixRow {
    id: string
    no_code: string                // unique within one SDG parent (AC-53)
    pillar_id: string              // FK MasterPillar
    key_business_action: string
    detail_action_solution: string
    action_indicator: Ref2 | null  // FK MkiSdg (type SDG_ACTION)
    alignment: string
    created_by_level: CreatedByLevel   // always 'Holding' from this screen
    taken_by_count: number         // >0 blocks delete (AC-54)
  }
  interface SdgFramework {
    id: string
    sdg_id: string                 // FK SdgGoal, Adopted only
    impact_type: SdgImpactType
    is_applied_to_all_entity: boolean
    applicable_entity_ids: string[]    // required min 1 when is_applied_to_all_entity = false (AC-50/51)
    status: 'Draft' | 'Published'
    rows: ActionPlanMatrixRow[]
  }
}
```

```ts
// OWNED BY STREAM F — src/services/action-plan-submission/types.d.ts
declare global {
  type TakeSkipDecision = 'Take' | 'Skip' | null
  type ActionPlanItemStatus = 'Pending Response' | 'Taken' | 'Skipped'
  interface ActionPlanSubmissionItem {
    id: string
    action_plan_row_id: string     // FK ActionPlanMatrixRow
    no_code: string
    sdg: Ref2
    key_business_action: string
    action_indicator: Ref2 | null
    decision: TakeSkipDecision
    skip_reason: string            // required when decision = 'Skip' (AC-93/94)
    status: ActionPlanItemStatus
  }
}
```

`Ref2` is declared once by Stream C and is then globally available. Any stream needing it before C merges: use an inline `{ id: string; name: string }` and a `// ponytail: swap to Ref2 once Stream C lands` comment — **do not declare a second `Ref2`**.

---

## 4. Shared behavioural rules (apply across streams)

- **Approved-only aggregation** (AC-70): dashboards/exports count only `flow_status === 'approved'`.
- **Submitted = read-only** (AC-84, AC-111): once submitted, the form renders disabled; only `rejected` reopens for edit/resubmit.
- **Reject requires notes** (AC-60, AC-66): reject button disabled until the notes textarea is non-empty; validate again on submit.
- **Dynamic Validation Engine** (FSD 2.9 table, reused by 2.14) — render by `MkiInputType`:
  `Number` → `MpInput type="number"`, rejects alphabetic; `Percentage` → number input, right-append `%`, range 0–100 inclusive; `Boolean` → `MpRadio`/toggle, Ya/Tidak; `Text` → `MpTextarea`.
  `evidence_attachment === 'Required'` → file uploader accepting `pdf,jpg,png,docx,csv`, max 4MB, **Submit disabled until a file is attached**.
  Streams C, D, F all need this. **Stream C owns it**: `src/components/DynamicFieldInput.vue` + `src/lib/dynamic-validation.ts` (pure predicates + one `dynamic-validation.check.ts`). D and F import it; if C hasn't merged, they build against the same file path and reconcile at merge (§6).
- **Unverified flag** (AC-69, AC-72, AC-104): items with `created_by_level === 'Subsidiary'` + `unverified === true` render an `MpBadge type="announcement"` reading `Unverified / Non-Official SDG`, permanently, before and after approval.

---

## 5. Streams

Each stream = one sub-agent, one worktree, one branch. Additive to `src/router/index.ts` only.

### Stream A — GRI Management (template release)
**FSD 2.1 · AC-38 … AC-42**

Replace the placeholder: delete `src/services/gri-quantitative.api.ts`, delete `GriQuantitativeTemplate` from `src/types/index.ts`, and rewrite `src/pages/gri-quantitative/{ListPage,DetailPage}.vue` against the real module below. Keep the existing route paths.

- Module `src/services/gri-release/`. List endpoint **confirmed**: `GET /v1/master-template-quantitative/index` → `[{ id, period_id: {id,name}, status: 'Published'|'Draft', template_name }]`. Detail/create/update/publish: unconfirmed, follow `/v1/master-template-quantitative/{detail,create,update,publish}`.
- Types (this stream owns): `GriRelease { id, template_name, period_id: {id;name}, category: 'GRI_QUANT'|'GRI_QUAL', status: 'Draft'|'Published', disclosures: GriDisclosure[] }`; `GriDisclosure { id, mki_id, mki_name, gri_code, input_type, unit, evidence, questions: GriQualQuestion[] }`.
- **GRI_QUANT disclosure** (AC-39): MKI picked via lookup → `input_type`, `unit`, `evidence` auto-fill **read-only** from the MKI record. Source the lookup from `@/services/master-key-indicator-quantitative` (old shape, still fine to read from) and `@/services/master-gri` for the GRI code.
- **GRI_QUAL disclosure** (AC-40/41): nested Q&A builder — reuse the already-shipped shape from `@/services/mki-gri-qualitative` (`MkiGriQualQuestion`, modes `Single` / `Conditional`) and **add a third mode `None`** (toggle only, no textarea) required by AC-41. Read `src/pages/mki-gri-qualitative/DetailPage.vue` — it already implements this repeatable-question editor; copy its interaction, don't invent one.
- **Publish** (AC-38): one `usePublishGriRelease()` mutation flipping status to `Published`; auto-distribution + notification are backend-side — `// ponytail: distribution/notification assumed backend-side on publish; UI only shows a success toast`.
- **Locked when published** (AC-42): if `status === 'Published'`, disclosure editing controls render disabled with an inline `MpNotification` telling the user to publish a new version. Client-side guard is enough.
- `validation.ts` + check: publish-lock guard, and disclosure must have ≥1 question when category is GRI_QUAL.
- Routes (existing paths, keep as-is): `/gri-quantitative` (list, no meta), `/gri-quantitative/detail` (`meta: { nextTheme: true }`).

### Stream B — SDG Adoption + SDG Framework
**FSD 2.2, 2.3 · AC-43 … AC-54**

Two modules, one agent (framework depends on adoption).

- `src/services/sdg-adoption/` — types per §3. 17 goals are backend-seeded; endpoints unconfirmed: `GET /v1/sdg-adoption/index`, `POST /v1/sdg-adoption/update` (toggles `adopted` only — no create/delete, AC: list is fixed).
  - Page: **grid of 17 cards** (icon + number + name + adopt toggle), not a table. `/sdg-adoption`, no detail route, saves per-toggle.
  - Guard (AC-45): toggling Adopted→Not Adopted is blocked when the goal has active Action Plan Matrix rows — surface the server error; client-side, disable the toggle when `has_active_action_plan === true` (add that boolean to `SdgGoal`) with a tooltip.
  - Audit trail (AC-43): show `updated_at` / `updated_by` on each card. Persistence is backend-side.
- `src/services/sdg-framework/` — types per §3. Endpoints unconfirmed: `/v1/sdg-framework/{index,detail,create,update,delete,publish}`.
  - List page `/sdg-framework`: one row per SDG parent (SDG name, impact type, entity scope, row count, status).
  - Detail page `/sdg-framework/detail` (`meta: { nextTheme: true }`): SDG parent picker **filtered to `adopted === true`** (AC-44) → then Impact Type single-select → `Is Applied to All Entity` toggle → `Applicable Entities` multi-select, **shown only when the toggle is false, min 1 required to save** (AC-49/50/51) sourced from `@/services/master-entity` filtered to `status === 'Active'`.
  - Investment Impact (AC-47/48): option disabled unless the selected entity scope is in the investment-impact entity list. That list has no admin screen — `// ponytail: hardcoded ['SDS','SBG','MEPPO'] until Administrator config exists`, in one exported const.
  - Action Plan Matrix child rows: repeatable editable table below the parent config, fields exactly per §3 `ActionPlanMatrixRow`. `pillar_id` from `@/services/master-pillar`, `action_indicator` from `@/services/mki-sdg`. `created_by_level` hardcoded `'Holding'`.
  - `validation.ts` + check: `no_code` unique within one framework (AC-53), delete blocked when any row has `taken_by_count > 0` (AC-54), applicable-entities min-1 rule (AC-51).

### Stream C — GRI Submission Quantitative + shared Dynamic Validation Engine
**FSD 2.9 · AC-80 … AC-86** (+ owns the §4 dynamic-field component and §3 approval types)

Migrate `evaluate-gri-quantitative` from the old shape to the services module shape. Delete `src/services/evaluate-gri-quantitative.api.ts` and `EvaluationGriQuantitative` + `GriQuantitativeTemplate`-adjacent types from `src/types/index.ts` once nothing imports them (grep first; `src/pages/evaluate-gri-quantitative/*` are yours to rewrite).

- `src/services/evaluate-gri-quantitative/` — **all endpoints confirmed** (§2.4 table). Read every `.yml` in `api/Evaluate GRI - Quantitative/` before writing `api.ts`; mirror the response field names exactly (`flow_status`, `entity_id: Ref2`, `period_id: Ref2`, `template_id: Ref2`, `submission_type_id: Ref2`, `items[].{columns,rows,category_id,name}`, `approval_logs`, `current_stage_order`, epoch-ms timestamps).
- Declare the §3 approval/`Ref2` globals here.
- **Ship first, in your first commit**, so other streams can build on it: `src/lib/dynamic-validation.ts` (pure: `isValidNumber`, `isValidPercentage`, `isAllowedEvidenceFile(name, sizeBytes)`, `canSubmit(...)`), `src/lib/dynamic-validation.check.ts`, and `src/components/DynamicFieldInput.vue` (props: `input_type`, `unit`, `modelValue`, `disabled`; emits `update:modelValue`) per §4.
- Requestor pages (Subsidiary side, 2.9): rewrite `src/pages/evaluate-gri-quantitative/RequestorPage.vue` (list, filters entity/period/template driven by the confirmed query params) and `DetailPage.vue` (the dynamic matrix form: `items[].columns` × `items[].rows`, each cell rendered by `DynamicFieldInput`).
- Submit locks the form read-only (AC-84); `flow_status === 'rejected'` reopens it and shows the reviewer note from the latest `approval_logs[].approvers[].notes` (AC-85).
- Duplicate guard (AC-86): before create, check the requestor index for an existing submission with the same `entity_id` + `period_id` + `template_id` in `draft|submitted|approved` and block with a validation message. Put the predicate in `validation.ts` and cover it in `api.check.ts` along with the AC-81/82/83 input rules.
- Routes: keep `/evaluate-gri-quantitative/requestor` and `/evaluate-gri-quantitative/detail` (`meta: { nextTheme: true }`). **Do not touch `ApprovalPage.vue`** — Stream E owns it.

### Stream D — GRI Submission Qualitative
**FSD 2.10 · AC-87 … AC-91**

- `src/services/evaluate-gri-qualitative/` — no contract. Mirror Stream C's confirmed endpoint set at `/v1/evaluate-gri-qualitative/{index,approval/index,detail,create,update,submit,approve,reject,cancel}` and flag each with `// ponytail: unconfirmed contract, mirrors evaluate-gri-quantitative`.
- Types: `GriQualSubmission { id, entity_id: {id;name}, period_id: {id;name}, template_id: {id;name}, flow_status, disclosures: GriQualSubmissionDisclosure[] }`, where each disclosure holds `questions: { id, title, answer_mode: 'Single'|'Conditional'|'None', follow_up, follow_up_yes, follow_up_no, answer: boolean|null, note: string }[]`. Field names for the template half must match Stream A's `GriQualQuestion` — code against §5 Stream A's shape, don't redefine `MkiGriQualAnswerMode` (already global, add `'None'` handling locally).
- Rendering rules (AC-87/88/89): `Conditional` → one textarea whose **label swaps live** with the toggle answer (`follow_up_yes` / `follow_up_no`); `Single` → one always-visible textarea labelled `follow_up`; `None` → toggle only.
- Validation (AC-90/91): every question's toggle must be non-null to submit; **all textareas optional**. Pure predicate in `validation.ts` + check.
- Pages: `src/pages/gri-qualitative/ListPage.vue` (`/gri-qualitative`), `DetailPage.vue` (`/gri-qualitative/detail`, `meta: { nextTheme: true }`).

### Stream E — Review & Approval + Change Request Approval
**FSD 2.4, 2.5 · AC-55 … AC-66**

- Rewrite `src/pages/evaluate-gri-quantitative/ApprovalPage.vue` into a 3-tab review page (`MpTabs`), route stays `/evaluate-gri-quantitative/approval`, and add a route alias `/review-approval` pointing at the same component.
  - Tab 1 GRI Quantitative — consumes `@/services/evaluate-gri-quantitative` (Stream C). If C hasn't merged, code against §3 types + the `api/Evaluate GRI - Quantitative/*.yml` contract and swap the import at merge; **do not create a second module for the same endpoints**.
  - Tab 2 GRI Qualitative — consumes `@/services/evaluate-gri-qualitative` (Stream D), same rule.
  - Tab 3 Action Plan Realization — consumes `@/services/report-plan-realization` (Stream F), same rule.
- Per-tab list: checkbox column + **Bulk Approve** over selected `submitted` rows (AC-62), one mutation call per row, invalidate the list key on settle.
- Reject flow (AC-60/61): modal with a required Reviewer Notes textarea; approve/reject buttons disabled while a decision is in flight.
- Approval line display (AC-55/56/57/58): render `approval_logs` as a stage list (stage_order, approval_type, approvers, status). A submission is only actionable by the current user when its `current_stage_order` matches the stage — surface stage state in the UI; **the real gating is server-side**, add `// ponytail: entity scoping + stage gating enforced server-side; UI only reflects approval_logs`.
- Entity scoping (AC-59): pass the logged-in user's entity as a query filter where the endpoint supports it; do not implement client-side row filtering as a security control.
- **2.5 Change Request Approval**: `src/services/action-plan-change-request/` is owned by Stream I. This stream builds only the Holding approval page `/action-plan-change-request/approval` (list of `Pending Review` requests + a **side-by-side existing vs proposed** detail view with Notes/Reason, AC-64/65/66), consuming Stream I's composables; stub against its §5-I type shape until it lands.
- Check: reject-requires-notes predicate + bulk-approve selection filter (only `submitted` rows selectable) in `validation.ts`.

### Stream F — Submit Action Plan (Take/Skip) + Report Plan Realization
**FSD 2.11, 2.14 · AC-92 … AC-97, AC-109 … AC-113**

- `src/services/action-plan-submission/` — types per §3. Endpoints unconfirmed: `/v1/action-plan-submission/{index,detail,update,submit}`.
  - List page `/action-plan-submission`: the distributed Action Plan Matrix rows for the current entity, each with Take / Skip actions.
  - **Skip** (AC-93/94): opens a modal with a required Justification textarea; empty justification rejects the save.
  - **Take** (AC-92): on approval the backend creates the Realization record — client-side, `// ponytail: realization instance created backend-side on approval; UI links to the realization list`.
  - Post-submit (AC-97): show `Download PDF` / `Download Excel` buttons — `// ponytail: export generated backend-side; buttons call the (unconfirmed) /v1/action-plan-submission/export?format=pdf|xlsx endpoint`.
- `src/services/report-plan-realization/` — endpoints unconfirmed: `/v1/report-plan-realization/{index,detail,create,update,submit}`. Type: `RealizationReport { id, action_plan_id, period_id: {id;name}, action_indicator: {id;name;input_type;evidence}, value, evidence_url, flow_status, reviewer_notes }`.
  - Detail form renders via `DynamicFieldInput` + `src/lib/dynamic-validation.ts` (Stream C owns these; if C hasn't merged, create them at those exact paths per §4 and reconcile at merge — identical content, so the merge is a no-op).
  - **Realization Window gate** (AC-96): submit disabled with an `MpNotification` when the active `MasterPeriod.realization_window !== 'Open'` (read from `@/services/master-period`). This is the one gate that must be enforced client-side too, since the button is the entry point — still also send the request and surface a server rejection.
  - Submitted → read-only; `rejected` → reopen + resubmit (AC-111/1112).
- `validation.ts` + check: skip-requires-justification, realization-window gate, evidence-required gate.
- Routes: `/action-plan-submission`, `/action-plan-submission/detail` (nextTheme), `/report-plan-realization`, `/report-plan-realization/detail` (nextTheme).

### Stream G — Strategic Insight Dashboards
**FSD 2.7 · AC-70 … AC-77**

Rewrite the three stub pages under `src/pages/dashboard/` (currently hardcoded arrays). Routes unchanged.

- `src/services/strategic-insight/` — **contracts confirmed**: `GET /v1/strategic-insight/sdg`, `/gri-quantitative`, `/gri-qualitative`. Read all three `.yml` files under `api/Dashboard/` and type the responses from their example bodies verbatim; do not reshape server aggregates client-side beyond what the ACs require.
- Global filters on every page: Reporting Period (year, from `@/services/master-period`) + Entity (from `@/services/master-entity`, plus an `All Entities` option) passed as query params; all charts re-render reactively without reload (AC-71, AC-73, AC-74).
- **SDG page** (`SdgPage.vue`): KPI cards (Holding SDG Roadmap, Strategic Alignment %, Execution Rate (Take), Bottom-Up Initiatives), a Strategic Action Matrix of Take-rate % per SDG, a full-width Aligned-vs-Initiated comparison chart, and a drill-down detail table (with Skip Reason) shown when a matrix cell is clicked.
  - Execution Rate counts **only** `created_by_level === 'Holding'` action plans in numerator and denominator (anti-greenwashing rule) — bottom-up items render in a visually separate column/colour (AC-72, §4 Unverified flag).
  - **Print-ready / zero-hover**: every percentage and label must be rendered as text on the bar/matrix itself, not only in a tooltip. Add an `@media print` block sized for A4.
- **GRI Quantitative page**: 8 thematic tabs — `General, Energy, Waste, Water, Diversity, Employment, OHS, Training` — each showing only its own GRI metrics (2-7/2-8, 302-1, 306-4/306-5, 303-3/303-4, 405-1/405-2, 401-1/401-3, 403-9, 404-1). Dynamic subtitle reflecting active filters, e.g. `Menampilkan: WS · 2025` (AC-76). `General` tab includes a PT-comparison bar chart (AC-77).
- **GRI Qualitative page**: same filter shell, driven by `/v1/strategic-insight/gri-qualitative`'s response shape.
- Charts: `MpChart` (already used in these files) — bar/line/pie/doughnut. Keep `SummaryBox` for KPI tiles.
- Aggregation for `All Entities` / all years: sum absolute metrics, average ratio metrics — put that in `aggregate.ts` (pure) with a check covering both branches (AC-75).

### Stream H — Performance Tracking + Data Export
**FSD 2.6, 2.8 · AC-67 … AC-69, AC-78, AC-79**

- `src/services/performance-tracking/` — unconfirmed: `GET /v1/performance-tracking/index?period&entity`, `POST /v1/performance-tracking/nudge`. Type: `TrackingRow { entity: {id;name}, period: {id;name}, submission_type, completion_percent, status: 'Draft'|'Submitted'|'Approved'|'Rejected', is_overdue, unverified }`.
  - Page `/performance-tracking`: grid of completion % per entity × submission type, status badges, and a **Nudge** button on overdue rows (AC-68).
  - "Real-time" (AC-67): `useQuery({ refetchInterval: 30_000 })` — `// ponytail: polling instead of websockets; swap when a push channel exists`.
  - Unverified items get the §4 badge (AC-69).
- `src/services/data-export/` — unconfirmed: `POST /v1/data-export/generate` returning a file URL. Page `/data-export`: filter form (period, entity, category = GRI Disclosure / SDG / Realization) + Export button, download link on success.
  - Only `Approved` data is exportable — the filter form must state this and the request must always carry `status: 'Approved'` (AC-78).
  - Audit log (AC-79) is backend-side: `// ponytail: export audit persisted backend-side; UI shows the recent-export list from /v1/data-export/index if present`.
- Check: filter→payload builder always pins `status: 'Approved'` and drops empty filters.

### Stream I — Initiate New Plan + Action Plan Change Request (Subsidiary)
**FSD 2.12, 2.13 · AC-98 … AC-108**

- `src/services/initiate-new-plan/` — unconfirmed: `/v1/initiate-new-plan/{index,detail,create,update,submit}`. Type: `InitiatedPlan { id, sdg_id, sdg_adopted: boolean, created_by_level: 'Subsidiary', origin_entity_id, unverified: boolean, status: 'Active'|'Pending Review'|'Taken', rows: ActionPlanMatrixRow[] }` (reuse Stream B's `ActionPlanMatrixRow` global; if B hasn't merged, code against §3's shape and do not redeclare it).
  - **Dual governance** — the core rule: SDG picked is `adopted` → save sets `status: 'Active'`, `unverified: false`, no approval queue (AC-98/99). SDG is **not** adopted → `status: 'Pending Review'`, `unverified: true`, goes to the Holding approval queue (AC-101/102). `unverified` stays `true` permanently, even after approval (AC-104).
  - Put this branch in `validation.ts` as one pure `resolveInitiatedPlanGovernance(sdgAdopted)` returning `{status, unverified, needs_approval}` and cover **both** branches plus the permanence of `unverified` in the check. This is the single most important piece of logic in the stream.
  - `created_by_level` always `'Subsidiary'`, `origin_entity_id` from the logged-in entity.
  - SDG picker lists **all 17** goals (adopted and not) from `@/services/sdg-adoption`, labelling non-adopted ones as requiring Holding approval.
  - Post-submit PDF/Excel buttons, same treatment as Stream F (AC-100).
  - Routes: `/initiate-new-plan`, `/initiate-new-plan/detail` (nextTheme).
- `src/services/action-plan-change-request/` — unconfirmed: `/v1/action-plan-change-request/{index,detail,create}`. Type: `ActionPlanChangeRequest { id, action_plan_id, existing: Partial<ActionPlanMatrixRow>, proposed: Partial<ActionPlanMatrixRow>, notes: string, status: 'Pending Review'|'Approved'|'Rejected', request_date, request_by, approved_date, approved_by, reviewer_notes }`. **Stream E consumes this type — keep these field names exactly.**
  - Page `/action-plan-change-request` (list of own requests + status) and `/action-plan-change-request/detail` (nextTheme): pick one `Taken`/`Active` action plan, edit the proposed fields, **Notes/Reason required** (AC-106).
  - Original plan data stays unchanged until approval (AC-105/107) — the UI must never optimistically mutate the source plan.
  - History view (AC-108): on the change-request detail, list all requests for that action plan with their audit fields.
  - Check: notes-required rule + "proposed differs from existing in ≥1 field" guard.

---

## 6. Integration / merge

1. Merge stream branches into `main` one at a time. Suggested order (minimises stub-swapping): **C → A → B → D → F → I → E → G → H**.
2. `src/router/index.ts` is the only genuinely shared file — resolve conflicts by **keeping both sides** (imports + route entries). Never drop a block.
3. On each merge, swap any temporary stub for the real import: `Ref2`/approval types (Stream C), `ActionPlanMatrixRow` (Stream B), `DynamicFieldInput` + `dynamic-validation.ts` (Stream C), change-request types (Stream I). Delete the stub file in the same commit.
4. Confirm no duplicate `declare global` for the same interface name: `grep -rn "interface \(Ref2\|ActionPlanMatrixRow\|ApprovalLog\|MasterStatus\|MkiInputType\)" src/services/*/types.d.ts` should show exactly one declaration each.
5. Once all streams are in, run `pnpm build` once (typecheck + build) and fix cross-stream drift then, not per-stream.
6. Run every `*.check.ts` (`node --experimental-strip-types <file>` per file's header comment).
7. Spot-check the `nextTheme` boundary: every `/detail` route has it, no list route does.
8. Backlog after this plan: migrate the last old-shape modules (`master-key-indicator-quantitative`, `master-category`) and delete `src/types/index.ts` + `src/services/api.ts` + `src/composables/useCrud.ts` once no importers remain.
