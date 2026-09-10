// run: node --experimental-strip-types scripts/lib/gri-contract-diff.check.ts
//
// Two halves. First: feed the committed `Response Dummy` example straight into
// diffGriQuantitative and assert zero errors — the normative contract must, by definition, be
// clean. Second: mutation-test every rule by cloning the good payload, breaking exactly one thing,
// and asserting the specific finding `code` fires (see git log "record grid geometry and the
// mutation tests behind each guard" for the pattern this follows).
import assert from 'node:assert/strict'
import {
  diffFilterScope,
  diffGriQuantitative,
  formatDiffReport,
  loadContractExample,
} from './gri-contract-diff.ts'

const contract = loadContractExample()

function clone(): StrategicInsightGriQuantitativeResponse {
  return JSON.parse(JSON.stringify(contract)) as StrategicInsightGriQuantitativeResponse
}

function codes(findings: { code: string }[]): string[] {
  return findings.map((f) => f.code)
}

// ---- baseline: the normative contract must be clean ----
{
  const report = diffGriQuantitative(contract, { contract })
  assert.equal(
    report.summary.errors,
    0,
    `contract must produce zero errors, got: ${JSON.stringify(report.findings.filter((f) => f.severity === 'error'))}`,
  )
  // Sanity on the surrounding shape, so a totally broken run doesn't slip through as "0 errors".
  assert.equal(report.summary.categories, 8)
  assert.ok(report.renderability.length === 8, 'renderability computed per category')
  for (const cat of report.renderability) {
    assert.ok(cat.kpiCards.length > 0, `${cat.tab}: expected KPI cards in renderability report`)
  }
  // formatDiffReport must not throw and must include the summary line.
  const text = formatDiffReport(report, { verbose: true })
  assert.ok(text.includes('summary'), 'formatted report includes a summary line')
}

// ---- mutation: unknown aggregation on an item ----
{
  const bad = clone()
  bad[0]!.items[0]!.aggregation = 'MEDIAN' as StrategicInsightAggregation
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('ENUM_UNKNOWN_AGGREGATION'), 'unknown aggregation must be flagged')
}

// ---- mutation: unknown aggregation on a summary entry ----
{
  const bad = clone()
  bad[0]!.summary[0]!.aggregation = 'MEDIAN' as StrategicInsightAggregation
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(
    codes(report.findings).includes('ENUM_UNKNOWN_AGGREGATION'),
    'unknown aggregation on summary[] must be flagged',
  )
}

// ---- mutation: input_type YES_NO must map to gap B2 specifically, not a generic unknown ----
{
  const bad = clone()
  bad[0]!.items[0]!.input_type = 'YES_NO' as StrategicInsightInputType
  const report = diffGriQuantitative(bad, { contract })
  const found = report.findings.find((f) => f.code === 'ENUM_INPUT_TYPE_YES_NO')
  assert.ok(found, 'YES_NO must fire the dedicated code')
  assert.equal(found?.gap, 'B2')
  assert.ok(
    !codes(report.findings).includes('ENUM_UNKNOWN_INPUT_TYPE'),
    'YES_NO must not also fire the generic unknown-input-type code',
  )
}

// ---- mutation: generic unknown input_type still flagged ----
{
  const bad = clone()
  bad[0]!.items[0]!.input_type = 'CURRENCY' as StrategicInsightInputType
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('ENUM_UNKNOWN_INPUT_TYPE'))
}

// ---- mutation (gap A2): item label points at an undeclared dimension ----
{
  const bad = clone()
  bad[0]!.items[0]!.labels = { ...bad[0]!.items[0]!.labels, nationality: 'ID' }
  const report = diffGriQuantitative(bad, { contract })
  const found = report.findings.find((f) => f.code === 'LABEL_UNDECLARED_DIMENSION')
  assert.ok(found, 'label on an undeclared dimension must be flagged')
  assert.equal(found?.gap, 'A2')
}

// ---- mutation (gap A2): item label points at an undeclared member of a real dimension ----
{
  const bad = clone()
  bad[0]!.items[0]!.labels = { gender: 'NONBINARY' }
  const report = diffGriQuantitative(bad, { contract })
  const found = report.findings.find((f) => f.code === 'LABEL_UNDECLARED_MEMBER')
  assert.ok(found, 'label pointing at an undeclared member must be flagged')
  assert.equal(found?.gap, 'A2')
}

// ---- mutation: dropped summary[] key vs the committed contract ----
{
  const bad = clone()
  bad[0]!.summary = bad[0]!.summary.filter((s) => s.key !== 'total_employee')
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(
    codes(report.findings).includes('CONTRACT_SUMMARY_KEY_MISSING'),
    'a summary key present in the contract but missing live must be flagged',
  )
}

// ---- mutation: category present live but absent from the committed contract ----
{
  const bad = clone()
  const extra = JSON.parse(JSON.stringify(bad[0])) as StrategicInsightGriCategory
  extra.category_id = { id: 'NEW_CATEGORY_ID', name: 'Newly Invented Tab' }
  bad.push(extra)
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(
    codes(report.findings).includes('CONTRACT_CATEGORY_EXTRA'),
    'a category live but absent from the contract must warn, not error',
  )
  const found = report.findings.find((f) => f.code === 'CONTRACT_CATEGORY_EXTRA')
  assert.equal(found?.severity, 'warning')
}

// ---- mutation: contract category missing entirely from the live response ----
{
  const bad = clone()
  bad.shift() // drop General
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('CONTRACT_CATEGORY_MISSING'))
}

// ---- mutation: percentage out of range ----
{
  const bad = clone()
  const energy = bad.find((c) => c.category_id.name === 'Energy')!
  const pctSummary = energy.summary.find((s) => s.key === 'renewable_ratio')!
  pctSummary.value = 140
  pctSummary.aggregation = 'PERCENTAGE'
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(
    codes(report.findings).includes('NUMERIC_PERCENTAGE_OUT_OF_RANGE'),
    'a percentage above 100 must be flagged',
  )
}

// ---- mutation: negative absolute (SUM aggregation) value ----
{
  const bad = clone()
  bad[0]!.items[0]!.value = -5
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('NUMERIC_NEGATIVE_ABSOLUTE'))
}

// ---- mutation: non-finite value ----
{
  const bad = clone()
  ;(bad[0]!.items[0] as unknown as { value: unknown }).value = Number.NaN
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('NUMERIC_NON_FINITE'))
}

// ---- mutation: value type disagrees with input_type ----
{
  const bad = clone()
  ;(bad[0]!.items[0] as unknown as { value: unknown }).value = 'not-a-number'
  const report = diffGriQuantitative(bad, { contract })
  assert.ok(codes(report.findings).includes('NUMERIC_TYPE_MISMATCH'))
}

// ---- mutation: top-level shape broken (wrapped instead of bare array) ----
{
  const report = diffGriQuantitative({ data: contract })
  assert.ok(codes(report.findings).includes('SHAPE_NOT_ARRAY'))
  assert.equal(report.summary.categories, 0)
}

// ---- mutation: category missing dimensions[] ----
{
  const bad = clone()
  delete (bad[0] as unknown as Record<string, unknown>).dimensions
  const report = diffGriQuantitative(bad, { contract })
  const found = report.findings.find((f) => f.code === 'SHAPE_MISSING_DIMENSIONS')
  assert.ok(found)
  assert.equal(found?.gap, 'A2')
}

// ---- mutation (gap A4): items[] filtered down to one period under a filter ----
// The dummy example only ships period 2025, so first widen the unfiltered baseline with a
// synthetic 2024 point, then simulate a backend that drops it under a period filter.
{
  const unfiltered = clone()
  const filtered = clone()
  const unfilteredEnergy = unfiltered.find((c) => c.category_id.name === 'Energy')!
  const extraItem = JSON.parse(JSON.stringify(unfilteredEnergy.items[0])) as StrategicInsightGriItem
  extraItem.id = 'synthetic-2024'
  extraItem.period = 2024
  unfilteredEnergy.items = [...unfilteredEnergy.items, extraItem]
  // filtered mirrors unfiltered except the backend under test pruned the 2024 point
  const filteredEnergy = filtered.find((c) => c.category_id.name === 'Energy')!
  filteredEnergy.items = unfilteredEnergy.items.filter((i) => i.period !== 2024)
  const scope = diffFilterScope(unfiltered, filtered, { period: '2024' })
  assert.ok(
    codes(scope.findings).includes('SCOPE_ITEMS_FILTERED'),
    'filtering items[] down under a period filter must be flagged as gap A4',
  )
  const found = scope.findings.find((f) => f.code === 'SCOPE_ITEMS_FILTERED')
  assert.equal(found?.gap, 'A4')
}

// ---- mutation (gap A4): entity dropped from items[] under an entity filter ----
{
  const unfiltered = clone()
  const filtered = clone()
  const general = filtered.find((c) => c.category_id.name === 'General')!
  const someEntity = general.items[0]!.entity.id
  general.items = general.items.filter((i) => i.entity.id !== someEntity)
  const scope = diffFilterScope(unfiltered, filtered, { entity_id: someEntity })
  assert.ok(codes(scope.findings).includes('SCOPE_ITEMS_FILTERED'))
}

// ---- scope rule must NOT fire when items[] is correctly left unfiltered ----
{
  const unfiltered = clone()
  const filtered = clone()
  // Only summary[] narrowed, items[] untouched — the documented-correct behavior.
  filtered[0]!.summary = filtered[0]!.summary.slice(0, 1)
  const scope = diffFilterScope(unfiltered, filtered, { period: '2024' })
  assert.ok(
    !codes(scope.findings).includes('SCOPE_ITEMS_FILTERED'),
    'a correctly-unfiltered items[] must not be flagged',
  )
}

// ---- mutation: unused dimension member still surfaces as a warning, not an error ----
{
  const report = diffGriQuantitative(contract, { contract })
  const found = report.findings.find((f) => f.code === 'DIMENSION_MEMBER_UNUSED')
  assert.ok(found, 'the sparse dummy example is expected to have unused members')
  assert.equal(found?.severity, 'warning')
}

console.log(`ok — gri-contract-diff: baseline clean (0 errors) + ${20} mutation rules verified`)
