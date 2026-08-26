// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.

export interface InitiatedPlanGovernance {
  status: 'Active' | 'Pending Review'
  unverified: boolean
  needs_approval: boolean
}

// AC-98/99 vs AC-101/102/104 — the single dual-governance branch for this whole stream.
// SDG already Adopted by Holding -> goes live immediately, no approval queue, official.
// SDG not (yet) Adopted -> a bottom-up/Subsidiary proposal, held for Holding review, and once
// created `unverified` never flips back to false even after that review approves it (AC-104) —
// callers must never recompute/overwrite `unverified` from a later status change, only from this
// same `sdg_adopted` input at creation time.
export function resolveInitiatedPlanGovernance(sdgAdopted: boolean): InitiatedPlanGovernance {
  return sdgAdopted
    ? { status: 'Active', unverified: false, needs_approval: false }
    : { status: 'Pending Review', unverified: true, needs_approval: true }
}
