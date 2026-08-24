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

### Feature module shape

Each feature (`gri-quantitative`, `evaluate-gri-quantitative`, `master-key-indicator-quantitative`, `dashboard/*`) follows the same three-layer split:

- `src/types/index.ts` — one shared file for all domain types (list/detail/payload shapes), not split per feature.
- `src/services/<feature>.api.ts` — the data layer. Some are `createMockApi()` (generic in-memory CRUD keyed by `id`, from `src/services/api.ts`) for simple lists; others (e.g. `master-key-indicator-quantitative.api.ts`) hand-roll a richer mock store with its own `index/create/update/remove` shape that mirrors a real future REST contract (list vs detail response shapes differ, `remove` is a soft-delete that flips status instead of deleting). **All current API modules are mocks** — swapping to real HTTP is meant to be a drop-in replacement of the module internals, keeping the same exported function signatures/JSON shapes. Check the module's own comments before assuming which style it follows.
- `src/pages/<feature>/ListPage.vue` + `DetailPage.vue` (or `RequestorPage.vue`/`ApprovalPage.vue` for the evaluate flow) — screens, using `useCrud()` (`src/composables/useCrud.ts`) for the generic list/create/update/remove state machine where applicable.

Detail pages receive their record via `history.pushState` from the row clicked in the list (`useHistoryRecord()` in `src/composables/useHistoryRecord.ts`) rather than a dedicated fetch-by-id API call — if there's no record in history state, it redirects back to the list's fallback path.

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
