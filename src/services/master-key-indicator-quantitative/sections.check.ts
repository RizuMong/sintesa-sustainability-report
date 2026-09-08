// run: node --experimental-strip-types src/services/master-key-indicator-quantitative/sections.check.ts
import assert from 'node:assert/strict'
import { toDisplayRows } from './sections.ts'

// --- legacy passthrough (AC-5 guard) ---------------------------------------------------------
{
  const legacy = [
    { sequence: 1, labels: { a: 'A1' } },
    { sequence: 2, labels: { a: 'A2' } },
    { sequence: 3, labels: { a: 'A3' } },
  ]
  const out = toDisplayRows(legacy)
  assert.deepEqual(
    out,
    [
      { kind: 'row', sequence: 1, labels: { a: 'A1' }, unit: null, depth: 0 },
      { kind: 'row', sequence: 2, labels: { a: 'A2' }, unit: null, depth: 0 },
      { kind: 'row', sequence: 3, labels: { a: 'A3' }, unit: null, depth: 0 },
    ],
    'flat legacy rows must come back identical, same order, depth 0, unit null',
  )
}

// --- grouped: two sections with children interleave section -> children -> section -> children ---
{
  const rows = [
    { sequence: 1, row_type: 'SECTION' as const, title: 'Section A' },
    { sequence: 2, labels: { a: 'A2' }, parent_sequence: 1 },
    { sequence: 3, labels: { a: 'A3' }, parent_sequence: 1 },
    { sequence: 4, row_type: 'SECTION' as const, title: 'Section B' },
    { sequence: 5, labels: { a: 'A5' }, parent_sequence: 4 },
  ]
  const out = toDisplayRows(rows)
  assert.deepEqual(
    out.map((r) => [r.kind, r.sequence, r.depth]),
    [
      ['section', 1, 0],
      ['row', 2, 1],
      ['row', 3, 1],
      ['section', 4, 0],
      ['row', 5, 1],
    ],
    'sections must be followed by their own children, in section order',
  )
}

// --- orphan row: parent_sequence points at a missing section -> lands at the end, depth 0 -----
{
  const rows = [
    { sequence: 1, row_type: 'SECTION' as const, title: 'Section A' },
    { sequence: 2, labels: { a: 'A2' }, parent_sequence: 1 },
    { sequence: 3, labels: { a: 'orphan' }, parent_sequence: 999 },
  ]
  const out = toDisplayRows(rows)
  assert.deepEqual(
    out.map((r) => [r.kind, r.sequence, r.depth]),
    [
      ['section', 1, 0],
      ['row', 2, 1],
      ['row', 3, 0],
    ],
    'orphan row (dangling parent_sequence) must land at the end, depth 0',
  )
}

// --- unit resolution: UNIFORM / PER_ROW / NONE -------------------------------------------------
{
  const uniformUnit = { id: 'u1', name: 'Ton' }
  const perRowUnit = { id: 'u2', name: 'Kg' }
  const rows = [
    { sequence: 1, labels: { a: 'A1' }, unit: perRowUnit },
    { sequence: 2, labels: { a: 'A2' } },
  ]

  const uniform = toDisplayRows(rows, { unit_mode: 'UNIFORM', unit: uniformUnit })
  assert.equal((uniform[0] as any).unit, uniformUnit, 'UNIFORM gives every row the table unit')
  assert.equal((uniform[1] as any).unit, uniformUnit, 'UNIFORM gives every row the table unit, even one with no own unit')

  const perRow = toDisplayRows(rows, { unit_mode: 'PER_ROW', unit: uniformUnit })
  assert.equal((perRow[0] as any).unit, perRowUnit, 'PER_ROW gives each row its own unit')
  assert.equal((perRow[1] as any).unit, null, 'PER_ROW gives null when the row has no own unit')

  const none = toDisplayRows(rows, { unit_mode: 'NONE', unit: uniformUnit })
  assert.equal((none[0] as any).unit, null, 'NONE gives null regardless of a table unit being set')
  assert.equal((none[1] as any).unit, null, 'NONE gives null')
}

// --- section rows never carry a unit -----------------------------------------------------------
{
  const rows = [
    { sequence: 1, row_type: 'SECTION' as const, title: 'Section A' },
    { sequence: 2, labels: { a: 'A2' }, parent_sequence: 1, unit: { id: 'u1', name: 'Ton' } },
  ]
  const out = toDisplayRows(rows, { unit_mode: 'PER_ROW' })
  assert.equal('unit' in out[0], false, 'section display rows have no unit property at all')
}

// --- order is not sequence: display_order wins over sequence ordering --------------------------
{
  const rows = [
    { sequence: 3, labels: { a: 'third by sequence, first by display_order' }, display_order: 1 },
    { sequence: 1, labels: { a: 'first by sequence, second by display_order' }, display_order: 2 },
    { sequence: 2, labels: { a: 'second by sequence, third by display_order' }, display_order: 3 },
  ]
  const out = toDisplayRows(rows)
  assert.deepEqual(
    out.map((r) => r.sequence),
    [3, 1, 2],
    'rows must come back in display_order order, not sequence order',
  )
}

console.log('sections.check.ts OK')
