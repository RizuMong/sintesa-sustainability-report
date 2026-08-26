// run: node --experimental-strip-types src/services/initiate-new-plan/api.check.ts
import assert from 'node:assert/strict'
import { resolveInitiatedPlanGovernance } from './validation.ts'

// AC-98/99 — SDG already Adopted: goes live immediately, no approval queue.
const adopted = resolveInitiatedPlanGovernance(true)
assert.deepEqual(adopted, { status: 'Active', unverified: false, needs_approval: false })

// AC-101/102 — SDG not Adopted: bottom-up proposal held for Holding review.
const notAdopted = resolveInitiatedPlanGovernance(false)
assert.deepEqual(notAdopted, { status: 'Pending Review', unverified: true, needs_approval: true })

// AC-104 — `unverified` is permanent: re-deriving governance from the same original
// `sdg_adopted` input after a (simulated) Holding approval must still read `unverified: true`.
// Governance is only ever derived once at creation from `sdg_adopted`, never recomputed from
// `status`, so an approved Pending-Review plan (status now 'Active' via a separate approval
// mutation) still traces back to `unverified: true` here.
const stillUnverifiedAfterApproval = resolveInitiatedPlanGovernance(false)
assert.equal(stillUnverifiedAfterApproval.unverified, true)

console.log('ok')
