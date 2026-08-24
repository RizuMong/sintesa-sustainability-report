// Pure validation/business-rule helpers, kept import-free (no '@/lib/http' alias) so the
// *.check.ts smoke test can run directly with plain node, no bundler/alias resolution needed.

// AC-19 (shared by MKI SDG and MKI GRI-Qualitative): Variable Code must be unique and
// SNAKE_CASE uppercase, e.g. KONSUMSI_LISTRIK_OPS.
export function isSnakeCaseCode(code: string): boolean {
  return /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/.test(code)
}

// AC-26: an indicator referenced by a Published template can't have its Input Type changed
// or be deleted.
// ponytail: stubbed always false — the real "used in a Published template" linkage doesn't exist
// yet (GRI/SDG Framework Creator, Module 2, isn't built). Swap this for a real reference-check
// once Module 2 lands.
export function isLocked(_item: Pick<MkiSdg, 'id'>): boolean {
  return false
}
