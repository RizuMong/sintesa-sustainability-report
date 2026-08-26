// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

// AC-42: once Published, disclosure editing controls render disabled — client-side guard only.
export function isEditingLocked(status: GriTemplateStatus): boolean {
  return status === 'Published'
}

// AC-41: a GRI_QUAL disclosure must carry at least one question before the release can publish.
// GRI_QUANT disclosures have no question builder, so they're always valid here.
export function validateDisclosuresForPublish(
  category: GriDisclosureCategory,
  disclosures: GriDisclosure[],
): string | null {
  if (category !== 'GRI_QUAL') return null
  const empty = disclosures.find((d) => d.questions.length === 0)
  if (!empty) return null
  return `Disclosure "${empty.gri_code || empty.mki_name || 'untitled'}" needs at least one question before publishing.`
}
