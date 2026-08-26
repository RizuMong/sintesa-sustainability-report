// pure, dependency-free — kept separate from api.ts so api.check.ts can import
// it via a relative path without Node having to resolve the '@/' tsconfig alias.

// AC-78: only Approved data is exportable — the request always pins status, and
// empty filter fields are dropped rather than sent as '' / undefined.
export function buildExportPayload(filter: ExportFilter): ExportPayload {
  const payload: ExportPayload = { status: 'Approved' }
  if (filter.period) payload.period = filter.period
  if (filter.entity) payload.entity = filter.entity
  if (filter.category) payload.category = filter.category
  return payload
}
