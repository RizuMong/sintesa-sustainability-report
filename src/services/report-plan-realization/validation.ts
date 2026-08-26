// pure, dependency-free — kept separate from api.ts so api.check.ts can import it via a
// relative path without Node having to resolve the '@/' tsconfig alias. Reuses the shared
// Dynamic Validation Engine (src/lib/dynamic-validation.ts) rather than re-deriving its rules.
import { canSubmit, isValidNumber, isValidPercentage } from '../../lib/dynamic-validation.ts'

// AC-96 — the one gate that must be enforced client-side too, since the submit button is the
// entry point (the request still goes to the server, which re-checks it).
export function isRealizationWindowOpen(period: MasterPeriod | undefined): boolean {
  return period?.realization_window === 'Open'
}

// AC-111/112 — submitted/approved renders read-only; only 'rejected' (or a brand-new draft)
// reopens the form for edit/resubmit.
export function isEditableRealization(flowStatus: RealizationFlowStatus): boolean {
  return flowStatus === 'draft' || flowStatus === 'rejected'
}

export function canSubmitRealization(params: {
  windowOpen: boolean
  editable: boolean
  inputType: MkiInputType
  value: string
  evidenceRequired: boolean
  hasEvidence: boolean
}): boolean {
  const { windowOpen, editable, inputType, value, evidenceRequired, hasEvidence } = params
  if (!windowOpen || !editable) return false
  if (inputType === 'Number' && !isValidNumber(value)) return false
  if (inputType === 'Percentage' && !isValidPercentage(value)) return false
  if ((inputType === 'Text' || inputType === 'Boolean') && value.trim() === '') return false
  return canSubmit(evidenceRequired ? 'Required' : 'Optional', hasEvidence)
}
