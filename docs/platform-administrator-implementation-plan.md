# Platform Administrator — Implementation Plan

Source spec: `docs/fsd/platform-administrator.md` (sections 1.1–1.11).
Gap analysis vs `src/router/index.ts` (current state, 2026-08-24).

## 0. Revision log

- **2026-08-24 — Services architecture pivot.** Original plan (§2/§3 v1) targeted `createMockApi()`/`useCrud()` in-memory mocks with types centralized in `src/types/index.ts`, matching the codebase's state at plan-writing time. User directed a switch to real `axios` calls + Tanstack Query, one folder per module (`services/<module>/{api,composables,types.d,index}.ts`), types declared `global` per-module instead of centralized — and to migrate existing modules to match, not just new ones. §2/§3/§4/§5 below were rewritten in place to the new convention; this entry is the record of that pivot. Landed as part of the pivot (ahead of the 6 streams below): `src/lib/http.ts` (shared axios instance + auth-envelope handling), `VueQueryPlugin` wired in `main.ts`, `src/services/master-unit/` migrated as the reference module, `CLAUDE.md` updated to document both the new convention and the old-shape modules still pending migration (`gri-quantitative`, `evaluate-gri-quantitative`, `master-key-indicator-quantitative`, `master-category` — tracked in §5 item 6, not yet done).

## 1. Gap analysis

Only two Platform Administrator pieces exist today, and only partially:

| FSD Section | Feature | Router status |
|---|---|---|
| 1.7 (partial) | MKI — GRI Quantitative | **Built** — `master-key-indicator-quantitative` (list+detail) |
| — | (dashboards, GRI Quant submission/evaluate) | Built but belong to Module 2, not Module 1 |
| 1.1 | Master Unit | Missing |
| 1.2 | Master Pillar | Missing |
| 1.2 | Master Period | Missing |
| 1.3 | Master Entity (self-referencing hierarchy) | Missing |
| 1.4 | Master GRI (catalog) | Missing (a `master-gri.api.ts` existed once for MKI-Quant's `code` FK lookup and was deliberately deleted — see `docs/mki-quantitative.md` §2. Do not resurrect it as part of that feature; it's now purely this new admin catalog) |
| 1.5 | Master Position | Missing |
| 1.5 | Master Employee | Missing |
| 1.6 | Access Management | Missing |
| 1.7 | MKI — GRI Qualitative (nested Q&A) | Missing |
| 1.7/1.8 | MKI — SDG | Missing |
| 1.9 | Workflow Configuration | Missing |
| 1.10 | Periodic Notification | Missing |
| 1.11 | Generate Action Plan — Log Generate | Missing |

11 net-new screens/features. `master-key-indicator-quantitative` is **not to be touched** — it stays as-is; MKI Qualitative and MKI SDG are new sibling features, not edits to it.

## 2. Conventions every stream must follow

Superseded from the original mock-CRUD plan — the repo now uses **real axios calls + Tanstack Query**, per-module folders (see `CLAUDE.md` § "Services module shape"). Apply this to every stream below, not the old `createMockApi`/`useCrud` pattern:

- Feature shape, one folder per module:
  ```
  src/services/<module>/
    api.ts          // axios calls through src/lib/http.ts, one method per endpoint, unwrap() the envelope
    composables.ts  // useQuery/useMutation wrapping api.ts, query key = ['<module>Api.<method>', ...params]
    types.d.ts       // declare global { interface X {...} } ... export {} — no import needed by consumers
    index.ts         // export * from './api' + export * from './composables'
  ```
  `src/services/master-unit/` is the landed reference implementation — copy its shape exactly (`getMasterUnit()` in `api.ts` → `useGetMasterUnit()` in `composables.ts` → global `MasterUnit` in `types.d.ts`).
- `src/pages/<feature>/ListPage.vue` + `DetailPage.vue` — pages call the module's `composables.ts` hooks (`useQuery`/`useMutation`) directly, not `useCrud()` (that composable only exists for old-shape modules being phased out, don't wire new features into it).
- Real HTTP, real backend contract. Check `api/` (Bruno collection, symlinked, one folder per module) for the actual request/response shape **before** writing `api.ts`. Current coverage: `Master Entity` has only `Index.yml` (no Create/Update/Delete yet); **Master GRI, Access Management, Workflow Configuration, Periodic Notification, Position, Employee, Generate Action Plan Log have no contract at all yet**. Where a contract is missing, follow the sibling REST convention already established (`{{base_url}}/v1/<module-kebab-case>/index|create|update|delete`, envelope `{code, data, error, message}`, `Authorization: {{token}}` header raw, no `Bearer` prefix) and flag the guess in a comment — don't block on backend coordination, don't invent a different shape.
- Soft-delete only, everywhere in this module — every "delete" AC in the FSD says "hanya dapat dinonaktifkan" (deactivate only). `remove`/`delete` methods in `api.ts` should call the deactivate endpoint (or `update` with `status: 'Inactive'` if no dedicated delete endpoint exists), never a hard delete.
- Reuse `src/components/TableFilter.vue` + `src/composables/useTableFilter.ts` for list filtering, and `src/components/ConfirmDeleteModal.vue` for the deactivate-confirmation flow. Don't build new versions of either.
- Route meta: **list routes get no `meta`** (2.1 theme), **detail/form routes get `meta: { nextTheme: true }`** (2.4 theme) — 100% consistent across every existing route pair, no exceptions.
- Before writing any `Mp*` markup: use pixel-hub MCP `get-block` (check for an existing block first — e.g. a data table, page header, or matrix/checkbox-grid block for Access Management), `get-component` (verify props/slots before use), `get-icon-name` (never invent icon names). Load `.agents/skills/pixel/SKILL.md` conventions.
- Every new `api.ts` gets one `*.check.ts` smoke test (plain `node:assert/strict`, no framework — see `src/composables/useOfficelessAuth.check.ts` for the existing example/run-command header comment) covering at minimum: the uniqueness/duplicate-validation rule and the soft-delete-not-hard-delete rule from that feature's AC list. Mock the axios instance / assert on `unwrap()` handling, don't hit a real network in the check script.
- No abstractions beyond what's asked — e.g. don't build a generic "hierarchy tree" component library; build the one Master Entity needs. Don't build a shared status-badge-map util preemptively; every existing page inlines its own ternary on `MpBadge`, keep doing that unless a stream personally needs the exact same map 3+ times.

## 3. Cross-cutting type contracts (defined here so streams don't block on each other)

Because types now live per-module in each module's own `types.d.ts` (global ambient, no import), **there is no shared-file contention on types at all** — every stream can declare its own global interface without touching anyone else's file. The shapes below are still specified centrally so a stream consuming another stream's entity as an FK/lookup can code against the exact same field names before the owning stream lands, and so nobody declares a conflicting global of the same name.

```ts
// owned by Stream B (Master Entity) — src/services/master-entity/types.d.ts
declare global {
  type EntityType = 'Subsidiary' | 'Business Unit' | 'Branch'
  type MasterStatus = 'Active' | 'Inactive'

  interface MasterEntity {
    id: string
    parent_entity_id: string | null
    name: string
    type: EntityType
    address: string
    status: MasterStatus
  }
}

// owned by Stream C (User Management) — src/services/master-position/types.d.ts, src/services/master-employee/types.d.ts
declare global {
  interface MasterPosition {
    id: string
    domain: string
    role: string
    entity_id: string | null // FK MasterEntity, nullable = generic cross-entity position
    name: string // computed label, e.g. "PIC Ekonomi - MPP"
    status: MasterStatus
  }

  interface MasterEmployee {
    id: string
    entity_id: string // FK MasterEntity
    position_id: string // FK MasterPosition
    full_name: string
    email: string // unique
    phone: string
    status: MasterStatus
  }
}
```

`MasterStatus`/`EntityType` are declared once (by Stream B, since Master Entity is the first to need them) and are then globally available to every other stream with no import — don't redeclare them elsewhere. Streams that only *consume* `MasterEntity`/`MasterEmployee`/`MasterPosition` as FK lookups (Workflow Configuration needs Entity+Employee; Access Management needs Position) call that module's real `composables.ts`/`api.ts` directly — since there's no file-level dependency (just an import of `@/services/master-entity`), this only blocks at merge time if the owning stream hasn't landed yet, not at type-declaration time. If truly needed before the owning stream merges, a consuming stream may add a temporary local `getMasterEntityStub()` in its own file and delete it once the real module lands — don't declare a second global `MasterEntity`.

## 4. Parallel workstreams

Each stream is sized to run as one sub-agent, independently, in its own git worktree. All streams are additive-only to shared files (`src/types/index.ts`, `src/router/index.ts`) — see §5 for the merge step.

### Stream A — Master Data Catalog (Pillar, Period, GRI)
FSD 1.2, 1.4. Three near-identical CRUD screens, same agent, same pattern — `services/<module>/{api,composables,types.d,index}.ts` modeled exactly on the landed `src/services/master-unit/` reference (Master Unit itself is already migrated, **don't touch it** — build its ListPage/DetailPage only, using `masterUnitApi`/`useGetMasterUnit` from `@/services/master-unit` as-is).
- Master Unit (page only, service already exists): `name`, `code`, `category` (enum: Energy/Emissions/Water/Waste/Headcount/Currency/Other — note: real backend field is `code` not `symbol`, per `api/Master Unit/Index.yml`), `status`. Endpoint confirmed: `GET /v1/master-unit/index`.
- Master Pillar: `code` (unique), `name`, `status`. No `api/` contract yet — follow `/v1/master-pillar/index|create|update` convention.
- Master Period: `year` (unique numeric), `status` (Active/Inactive), `realization_window` (Open/Closed) — second independent toggle, AC-04. Check `api/Master Period/` for contract before guessing.
- Master GRI: `gri_code` (unique), `gri_series` (enum: Universal/Economic/Environmental/Social), `disclosure_title`, `status`. No `api/` contract yet.
- All: deactivate action, not delete (AC-03/AC-05/AC-09 equivalents) — `api.ts`'s remove/delete method flips `status: 'Inactive'`, behind `ConfirmDeleteModal`.
- Routes: `/master-unit`, `/master-unit/detail`, `/master-pillar`, `/master-pillar/detail`, `/master-period`, `/master-period/detail`, `/master-gri`, `/master-gri/detail`.

### Stream B — Master Entity (self-referencing hierarchy)
FSD 1.3. Highest-novelty stream — **no existing tree/hierarchy pattern in this codebase** (confirmed via grep). Check `get-block` first for a Pixel3 tree/org-chart block before hand-building a recursive component.
- Type: see §3 `MasterEntity` (this stream owns and declares it).
- `api/Master Entity/Index.yml` exists (`GET /v1/master-entity/index`) — use it for `getMasterEntity()`. No Create/Update/Delete contract yet; follow the `/v1/master-entity/create|update|delete` convention and flag as unconfirmed.
- `api.ts` denormalizes `parent_entity_id` by looking the parent up via its own `getMasterEntity()` result and attaching `{id, name}` for display — same cross-reference technique as the old `master-key-indicator-quantitative.api.ts`'s `resolvePayload()`, just via axios now instead of an in-memory store.
- Business rules to encode: Business Unit/Branch require a valid, Active parent (AC-07); Subsidiary's parent is always `null` (AC-06); Inactive entities excluded from parent-picker options (AC-08); entities with active reporting data can't be hard-deleted (AC-09 — always deactivate, never hard delete).
- List view: flat table is acceptable for v1 (indent by depth or show parent name as a column) — a full expand/collapse tree is a stretch goal, not required by any AC.
- Routes: `/master-entity`, `/master-entity/detail`.

### Stream C — User Management (Position, Employee, Access Management)
FSD 1.5, 1.6. Three related screens sharing a domain; one agent to avoid cross-stream FK churn.
- Master Position: services module shape, model on `master-unit`. Type: see §3 (this stream owns `MasterPosition`/`MasterEmployee`). No `api/` contract yet — `/v1/master-position/...` convention.
- Master Employee: services module shape, but `entity_id`/`position_id` are FK dropdowns — resolve display labels client-side by calling `@/services/master-entity` and this stream's own `master-position` composables (import the real module; if Stream B hasn't merged yet, code against the §3 `MasterEntity` shape and swap the import in at merge time). Email uniqueness validation client-side before create/update (AC-12). No `api/` contract yet. Inactive employees can't "login" — no real auth flow to gate here, just surface status in the list/detail.
- Access Management: **new UI shape**, not a list+detail pair — a matrix (Position × App × Page checkboxes). App/Page catalog is static seed data taken verbatim from FSD §3.2's menu table (2 Apps: "Platform Administrator", "Sustainability Reporting"; Pages = the Menu/Sub-Menu rows) — no CRUD needed for the App/Page catalog itself, only for the Position→Page grant matrix. Store as `Record<positionId, Set<pageId>>` or an array of `{position_id, app, page}` grant rows. One page, no detail route — matrix saves in place.
- Routes: `/master-position`, `/master-position/detail`, `/master-employee`, `/master-employee/detail`, `/access-management` (no detail route).

### Stream D — MKI extensions (GRI Qualitative, SDG)
FSD 1.7 (GRI_QUAL half), 1.8. Extends the *pattern* of `master-key-indicator-quantitative`, not its code — new sibling files, existing MKI Quant page/service is untouched.
- MKI — SDG: closest to MKI Quant's shape (Unit + Input Type conditional-required per FSD 1.7 table) but adds `created_by_level: 'Holding' | 'Subsidiary'` and `origin_entity_id` (nullable) per FSD 1.8 — Platform Administrator's screen here is full CRUD + Read-Only visibility over Subsidiary-created ones (AC-27–29 describe the Subsidiary-side scoped create, which belongs to a *different* module/portal, not this admin screen — this stream only builds the Administrator's full-CRUD + audit-visibility view).
- MKI — GRI Qualitative: **new nested Q&A schema builder** — no Unit/Input Type fields (AC-21), instead a nested question schema (question text, question type, sub-questions). This is the most open-ended screen in the whole plan; check `get-block` for any existing form-builder/nested-list block before designing from scratch. Keep the nesting shallow (one level of sub-questions) unless the mockup images (`docs/fsd/images/image27.png`) show deeper nesting — inspect those images first.
- Both: Variable Code unique SNAKE_CASE validation (AC-19), locked Input Type + no-delete once referenced by a Published template (AC-26) — store a `locked: boolean` computed off a stubbed "used in published template" flag (real linkage doesn't exist yet since GRI/SDG Framework Creator, Module 2, isn't in scope here — stub the flag to always `false` for now, note it as a follow-up wiring point once Module 2 exists).
- Routes: `/mki-gri-qualitative`, `/mki-gri-qualitative/detail`, `/mki-sdg`, `/mki-sdg/detail`.

### Stream E — Workflow Configuration
FSD 1.9. One screen, self-contained complexity (multi-level approval line array).
- Type: `WorkflowConfig { id, workflow_name: 'GRI_QUANTITATIVE'|'GRI_QUALITATIVE'|'SDG_ACTION_PLAN'|'SDG_REALIZATION', entity_id, status, approval_lines: {approval_type: 'Holding Approval'|'By PIC', employee_ids: string[]}[] }`.
- Business rule to encode client-side: only one Active workflow per (entity_id, workflow_name) pair — validate on save (AC-31).
- Employee multi-select per level resolves against Stream C's Master Employee mock (stub against §3 shape if not yet landed).
- Detail page: dynamic add/remove approval-level rows — check `get-block` for a repeatable-row form block before hand-building.
- Routes: `/workflow-configuration`, `/workflow-configuration/detail`.

### Stream F — Periodic Notification + Generate Action Plan Log
FSD 1.10, 1.11. Two smaller/simpler screens, paired for balance.
- Periodic Notification: services module shape. Fields: title, `deadline_month` (1-12), `deadline_day` (1-31), `reminder_days_before`, `notification_type` (Action Plan/Realization Report/GRI Quant/GRI Qual enum), status. No `api/` contract yet.
- Generate Action Plan — Log Generate: **read-only log table**, no detail/edit route — columns: timestamp, trigger type (Manual/Scheduled), submission_type, recipient count, status (Success/Failed). One "Re-trigger" mutation (`useMutation`) per failed row calling a `POST /v1/generate-action-plan-log/retrigger` (unconfirmed contract, flag it) that appends a new Manual-trigger log row with status Success; invalidate the log query key on success.
- Routes: `/periodic-notification`, `/periodic-notification/detail`, `/generate-action-plan-log` (list only, no detail).

## 5. Integration / merge step (after all streams land)

Only `src/router/index.ts` is shared/additive across streams now — every module's types live in its own `types.d.ts`, so there's no type-file contention at all (unlike the old single `src/types/index.ts` plan).

1. Merge each stream's branch/worktree into `main` one at a time.
2. On each merge, resolve `src/router/index.ts` conflicts by keeping both sides (additive route entries + imports) — never drop a block.
3. Where a stream coded against a §3 stub for another stream's not-yet-landed entity (e.g. Stream E against `MasterEmployee` before Stream C merged), swap the stub import for the real `@/services/<module>` import once that stream is in.
4. After all streams are merged, run `pnpm build` once (typecheck + build) to catch cross-stream type drift and fix at that point rather than per-stream.
5. Spot-check the two `nextTheme` boundaries and the App/Page names in Access Management against FSD §3.2's menu table for typos.
6. Backlog (not blocking this plan, tracked separately): migrate the remaining old-shape modules — `gri-quantitative`, `evaluate-gri-quantitative`, `master-key-indicator-quantitative`, `master-category` — to the services module shape, one at a time, mirroring `master-unit`.

## 6. Suggested dispatch

Six sub-agents, one per stream (A–F), `isolation: "worktree"`, run in parallel. Give each agent: this plan file's path, its own section (§4), plus §2 (conventions) and §3 (shared type contracts) verbatim in the prompt — don't make it re-read the whole FSD, point it at only its own subsection(s) of `docs/fsd/platform-administrator.md` (§1.1–1.11 as mapped in §1's gap table) plus the relevant `docs/fsd/images/imageNN.png` mockup references for its screens.
