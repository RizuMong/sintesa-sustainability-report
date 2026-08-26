// ponytail: reconcile with Stream C at merge — Stream C owns this file (FSD §4 Dynamic
// Validation Engine, reused by GRI-Quant, GRI-Qual and this stream's realization form).
// Built here at the same path so Stream C's merge is a content swap, not a new file.
//
// pure, dependency-free — kept separate so *.check.ts files can import it via a relative
// path without Node having to resolve the '@/' tsconfig alias.

export function isValidNumber(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return false
  return /^-?\d+(\.\d+)?$/.test(trimmed)
}

// AC-90-adjacent rule (FSD 2.9 table): 0–100 inclusive
export function isValidPercentage(value: string): boolean {
  if (!isValidNumber(value)) return false
  const n = Number(value)
  return n >= 0 && n <= 100
}

const ALLOWED_EVIDENCE_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'csv']
const MAX_EVIDENCE_BYTES = 4 * 1024 * 1024

export function isAllowedEvidenceFile(name: string, sizeBytes: number): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EVIDENCE_EXTENSIONS.includes(ext)) return false
  return sizeBytes > 0 && sizeBytes <= MAX_EVIDENCE_BYTES
}

// Submit disabled until: the value matches its input_type's rule, and (when evidence is
// Required) a file has been attached — FSD §4 Dynamic Validation Engine.
export function canSubmit(params: {
  inputType: MkiInputType
  value: string
  evidenceRequired: boolean
  hasEvidence: boolean
}): boolean {
  const { inputType, value, evidenceRequired, hasEvidence } = params
  if (evidenceRequired && !hasEvidence) return false
  if (inputType === 'Number') return isValidNumber(value)
  if (inputType === 'Percentage') return isValidPercentage(value)
  if (inputType === 'Boolean') return value === 'true' || value === 'false'
  return value.trim().length > 0 // Text
}
