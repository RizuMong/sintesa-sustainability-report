// pure, dependency-free — no '@/' imports so dynamic-validation.check.ts can import it via a
// relative path without Node having to resolve the '@/' tsconfig alias.
// FSD 2.9 dynamic field table (§4 of the impl plan) — reused by Streams C, D, F.

const ALLOWED_EVIDENCE_EXTENSIONS = ['pdf', 'jpg', 'png', 'docx', 'csv']
const MAX_EVIDENCE_BYTES = 4 * 1024 * 1024 // 4MB

// Number — MpInput type="number", rejects alphabetic
export function isValidNumber(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return false
  return /^-?\d+(\.\d+)?$/.test(trimmed)
}

// Percentage — number input, range 0-100 inclusive
export function isValidPercentage(value: string): boolean {
  if (!isValidNumber(value)) return false
  const n = Number(value)
  return n >= 0 && n <= 100
}

// evidence_attachment === 'Required' → file uploader accepting pdf,jpg,png,docx,csv, max 4MB
export function isAllowedEvidenceFile(name: string, sizeBytes: number): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EVIDENCE_EXTENSIONS.includes(ext) && sizeBytes > 0 && sizeBytes <= MAX_EVIDENCE_BYTES
}

// Submit disabled until a required-evidence file is attached
export function canSubmit(evidenceAttachment: MkiEvidenceAttachment, hasFile: boolean): boolean {
  return evidenceAttachment !== 'Required' || hasFile
}
