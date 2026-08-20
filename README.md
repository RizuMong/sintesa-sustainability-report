# Sintesa Sustainability Report

Vue 3 + TypeScript + Vite SPA for GRI/SDG sustainability reporting (GRI quantitative/qualitative data, evaluation workflow, Master Key Indicator schema builder, dashboards). Built with the `@mekari/pixel3` design system and embedded as an iframe inside Mekari's "Officeless" low-code app — it is not a standalone site.

## Stack

- Vue 3 (`<script setup>`) + TypeScript + Vite
- `vue-router` — flat routes, no shared layout (each screen is deep-linkable on its own)
- `@mekari/pixel3` — UI components + design tokens (two token modes coexist, toggled per-route)
- pnpm (`pnpm@11.13.0`) as package manager

## Commands

```bash
pnpm install
pnpm dev       # start dev server
pnpm build     # typecheck (vue-tsc) + production build
pnpm preview   # preview production build
```

No test runner is configured. Tests are plain Node scripts (`*.check.ts`, co-located with the module they test) using `node:assert/strict` — see the header comment in each file for the exact run command.

## How it's wired together

- **Auth**: the whole app sits behind a single embed-auth gate in `src/App.vue`. Token/env/company come from the URL query string on first load (`src/composables/useOfficelessAuth.ts`) — see `docs/lowcode-embed-officeless.md`.
- **Feature modules**: each feature (`gri-quantitative`, `evaluate-gri-quantitative`, `master-key-indicator-quantitative`, `dashboard/*`) follows the same shape: types in `src/types/index.ts`, a mock API in `src/services/<feature>.api.ts`, screens in `src/pages/<feature>/`. All current API modules are mocks, written so swapping to real HTTP is a drop-in replacement.
- **Per-feature docs**: `docs/<feature>.md` records the "as built" contract and any deviations from the original spec — check these before assuming a feature's behavior.

For the full architecture rundown (routing, auth gate detail, token modes, module conventions), see `CLAUDE.md`.
