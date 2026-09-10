// run: node --experimental-strip-types src/services/strategic-insight/normalize.check.ts
//
// Feeds the REAL live payload (src/services/strategic-insight/fixtures/live-gri-quantitative.json,
// generated from .temp/api-verify/2026-09-10T14-18-19-587Z/gri-unfiltered.json, redacted — this
// dump carries no tokens/emails so redaction was a no-op) through normalizeGriQuantitative() and
// asserts the pure renames/derivations Phase 1 claims: category_id resolved, unit_id -> unit,
// gri_codes trimmed to tab roots, resolveTab() recognizes the result.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizeGriQuantitative } from './normalize.ts'
import { categoryCaption, chartCardsFor } from './chart-spec.ts'

const fixturePath = fileURLToPath(new URL('./fixtures/live-gri-quantitative.json', import.meta.url))
const wire = JSON.parse(readFileSync(fixturePath, 'utf8')) as StrategicInsightGriQuantitativeWireResponse

// ---- baseline: the live fixture really is the 2-category wire shape ----
assert.equal(wire.length, 2)
assert.equal(wire[0]!.category, 'GENERAL')
assert.equal(wire[1]!.category, 'ENERGY')
assert.equal((wire[0]!.items[0] as unknown as { labels?: unknown }).labels, undefined)

const { categories } = normalizeGriQuantitative(wire)
assert.equal(categories.length, 2)

const [general, energy] = categories as [StrategicInsightGriCategory, StrategicInsightGriCategory]

// ---- category: bare string -> Ref2 via CATEGORY_SLUGS ----
assert.equal(general.category_id.name, 'General')
assert.equal(energy.category_id.name, 'Energy')
assert.ok(general.category_id.id.length > 0, 'category_id.id must be resolved, not blank')

// ---- gri_codes: unique, trimmed to tab root, first-seen order ----
assert.deepEqual(general.gri_codes, ['2-7', '2-2', '2-3', '2-23'])
assert.deepEqual(energy.gri_codes, ['302-1'])

// ---- unit_id -> unit, on both summary[] and items[] ----
for (const s of [...general.summary, ...energy.summary]) {
  assert.ok(!('unit_id' in s), `summary[key=${s.key}] must not carry unit_id`)
  assert.ok('unit' in s, `summary[key=${s.key}] must carry unit`)
}
for (const i of [...general.items, ...energy.items]) {
  assert.ok(!('unit_id' in i), `item ${i.id} must not carry unit_id`)
  assert.ok('unit' in i, `item ${i.id} must carry unit`)
}
// spot-check one non-null unit survived the rename intact
const managerRatio = general.items.find((i) => i.gri_code === '2-7b')!
assert.deepEqual(managerRatio.unit, { id: '9', name: '%' })

// ---- sequence: response order + 1 ----
assert.equal(general.sequence, 1)
assert.equal(energy.sequence, 2)

// ---- resolveTab() (exercised indirectly via chartCardsFor, which is the real render path) ----
// Both categories have no dimensions[] yet (Phase 2), so no cards render — but chartCardsFor must
// not throw, and the category must resolve to a real tab rather than falling through generically.
// categoryCaption() is the direct probe for resolveTab() without reaching into chart-spec.ts internals.
assert.equal(categoryCaption(general), 'Total karyawan & pekerja non-karyawan', 'general gri_codes must resolve resolveTab() to "general"')
assert.equal(categoryCaption(energy), 'Konsumsi energi dalam organisasi', 'energy gri_codes must resolve resolveTab() to "energy"')

// chartCardsFor must not throw even with empty dimensions[] (Phase 2 fills these in)
assert.doesNotThrow(() => chartCardsFor(general))
assert.doesNotThrow(() => chartCardsFor(energy))

console.log('ok — normalize: Phase 1 renames/derivations verified against the live fixture')
