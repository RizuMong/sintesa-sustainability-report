# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm (`packageManager: pnpm@11.13.0` — do not use npm/yarn).

- `pnpm dev` — start Vite dev server
- `pnpm build` — typecheck (`vue-tsc -b`) then production build
- `pnpm preview` — preview the production build

No test runner is configured. Tests are plain Node scripts using `node:assert/strict`, named `*.check.ts` and co-located with the module they test (e.g. `src/composables/useOfficelessAuth.check.ts`). Run one directly with `node --experimental-strip-types src/composables/useOfficelessAuth.check.ts` (or whatever TS runner is available) — the file's own header comment states the exact run command. `*.check.ts` files are excluded from the app build (see `tsconfig.app.json`).

## Architecture

Vue 3 (`<script setup>`) + TypeScript + Vite SPA, embedded as an iframe inside Mekari's "Officeless" low-code app, using `@mekari/pixel3` (Pixel 3 design system).

### Embed auth gate

The whole app runs behind a single auth gate in `src/App.vue`: `initOfficelessAuth()` reads `token`/`env`/`company_id` from the URL query string once at startup (`src/composables/useOfficelessAuth.ts`), since the parent Officeless workflow only puts the token on the URL the iframe is first loaded with — it's captured before any client-side navigation. Until status is `'ok'`, the `RouterView` doesn't render; a 401/expired screen shows instead. There's no upfront token-verify call — validity is only proven when the first real workflow API call (`authFetch`) either succeeds or maps its response to `'expired'`/`'unauthorized'` via `statusFromResponse`. See `docs/lowcode-embed-officeless.md` for the full contract.

### Pixel 3 design token modes

Two token modes coexist. `usePixelTheme().setNextTheme(...)` is toggled per-route in `App.vue` based on `route.meta.nextTheme`: routes without that meta render in the original (2.1-era) theme, routes with `meta: { nextTheme: true }` (the `DetailPage.vue` screens) render in the 2.4 token theme. When adding a new page, decide deliberately which theme band it belongs to and set the route meta accordingly — don't assume.

### Routes are flat, no shared layout

`src/router/index.ts` — every route points directly at a top-level page component; there is no wrapper layout. This is deliberate so each screen can be deep-linked/embedded independently by the parent Officeless app.

### Services module shape (current convention)

Every feature's data layer lives in its own folder under `src/services/<module>/`:

```
services/<module>/
  api.ts          // axios calls through the shared src/lib/http.ts instance, one method per endpoint
  composables.ts  // that api.ts wrapped in Tanstack Query (useQuery/useMutation)
  types.d.ts      // ambient global types for the module — `declare global { interface X {...} } / export {}`, no import needed by consumers
  index.ts        // `export * from './api'` + `export * from './composables'`
```

- `src/lib/http.ts` — the shared axios instance. Request interceptor sets `baseURL`/`Authorization` from `useOfficelessAuth()`'s config (same token/env the embed auth gate captured); response interceptor unwraps nothing itself but maps the `{code, data, error, message}` envelope through `statusFromResponse()` and calls `markAuthStatus()`, mirroring `authFetch`'s behavior so axios and fetch-based calls agree on auth state. Use the exported `unwrap<T>()` helper in `api.ts` methods to pull `.data.data` out of the envelope.
- `types.d.ts` uses `declare global` (not a named export) — this is deliberate so `MasterUnit` (etc.) is usable in any file with zero import, matching the shape the user specified. Don't add a second same-named type elsewhere (`src/types/index.ts` is being wound down — see below).
- Real endpoints: check `api/` (see References) for the actual path/payload/response shape before writing `api.ts` — grep the module's folder there first. If no contract exists yet for a given mutation (create/update/delete), follow the sibling `index`/`GET` convention (`{{base_url}}/v1/<module>/<action>`) as a placeholder and flag it, don't invent an unrelated shape.
- Query keys: `['<moduleName>Api.<methodName>', ...params]` — see `src/services/master-unit/composables.ts` for the reference implementation.
- **Migration status**: `master-unit` is the reference module on the new shape. `gri-quantitative`, `evaluate-gri-quantitative`, `master-key-indicator-quantitative`, `master-category` are still on the old shape below (flat `src/services/<feature>.api.ts` + in-memory mock + `useCrud()`) — migrate one module at a time, mirroring `master-unit`, rather than mixing old/new inside one module.

### Old shape (pre-migration, still in use by unmigrated modules)

- `src/types/index.ts` — one shared file for all domain types belonging to old-shape modules only. Once a module migrates, its types move to that module's own `types.d.ts` (ambient global) and get deleted here — don't add new types here for new modules.
- `src/services/<feature>.api.ts` — either `createMockApi()` (`src/services/api.ts`, generic in-memory CRUD keyed by `id`) or a hand-rolled mock store (e.g. `master-key-indicator-quantitative.api.ts`, `index/create/update/remove` with soft-delete). Still in-memory mocks, not axios — do not extend this pattern for new modules, use the services module shape above instead.
- Pages use `useCrud()` (`src/composables/useCrud.ts`) for the generic list/create/update/remove state machine.

Detail pages in old-shape modules receive their record via `history.pushState` from the row clicked in the list (`useHistoryRecord()` in `src/composables/useHistoryRecord.ts`) rather than a dedicated fetch-by-id API call — if there's no record in history state, it redirects back to the list's fallback path. New-shape modules fetch by id directly through their `composables.ts` (`useQuery` keyed on the route's `id` param) instead.

Design decisions and deviations from an original spec for a given feature are written up in `docs/<feature>.md` as an "As Built" doc (see `docs/mki-quantitative.md`) — check for one before assuming a feature's contract; it documents intentional differences from what may be in git history/PRs.

### Pixel 3 UI conventions

A `pixel` skill (`.agents/skills/pixel/SKILL.md`, symlinked for Claude Code) governs how Pixel 3 components get built here — load it when implementing or modifying UI. Key rules it enforces: import from `@mekari/pixel3`; use `Mp*`/`Pixel.*` components and their CSS props over raw HTML/CSS; use `get-block`/`get-component`/`get-icon-name` (pixel-hub MCP tools) to verify blocks, props, and icon names instead of guessing; prefer semantic design tokens (`background.surface`, `text.default`, `pxl-space-md`) over raw values; token mode defaults to 2.4.

### Comment conventions already in use

Several files use a `// ponytail: ...` comment to flag a deliberate simplification and its upgrade path (e.g. the mock API layer, the no-upfront-verify auth choice). Preserve this pattern when making similar deliberate shortcuts, and check existing `ponytail:` comments before "fixing" something that was cut on purpose.

## References

- FSD: `docs/fsd`
  - FSD Introduction: `docs/fsd/INTRODUCTION.md`
  - FSD Platform Administrator: `docs/fsd/platform-administrator.md`
  - FSD Sustainability Reporting: `docs/fsd/sustainability-reporting.md`
- API collection: `api/` — symlink to `~/Projects/vas-api-collection/SLM/collections/Sintesa` (separate repo, gitignored here). Bruno/opencollection `.yml` files, one folder per feature, mirroring `src/services/*.api.ts`. Real REST contract — grep it before changing a mock API module's request/response shape.
