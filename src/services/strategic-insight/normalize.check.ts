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
import { seriesByDimension } from './aggregate.ts'

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

// ==== Phase 2: description -> labels, via the declared vocabulary ====

const { warnings } = normalizeGriQuantitative(wire)

// ---- Laki-laki -> {gender: MALE}, Perempuan -> {gender: FEMALE} ----
const laki = general.items.find((i) => i.description === 'Laki-laki')!
assert.deepEqual(laki.labels, { gender: 'MALE' })
const perempuan = general.items.find((i) => i.description === 'Perempuan')!
assert.deepEqual(perempuan.labels, { gender: 'FEMALE' })

// ---- Non-Renewable -> {renewability: NON_RENEWABLE}, Renewable -> {renewability: RENEWABLE} ----
const nonRenewable = energy.items.find((i) => i.description === 'Non-Renewable')!
assert.deepEqual(nonRenewable.labels, { renewability: 'NON_RENEWABLE' })
const renewable = energy.items.find((i) => i.description === 'Renewable')!
assert.deepEqual(renewable.labels, { renewability: 'RENEWABLE' })

// ---- 'Manajerial' has no vocabulary entry in GENERAL -> unmatched, warning pushed, no labels invented ----
const manajerial = general.items.find((i) => i.description === 'Manajerial')!
assert.deepEqual(manajerial.labels, {}, 'unmatched description must not invent a label')
assert.ok(
  warnings.some((w) => w.includes('Manajerial')),
  'an unmatched description must be recorded in warnings, not silently dropped',
)

// ---- seriesByDimension(general, 'gender') yields two non-empty series from the real fixture ----
const genderSeries = seriesByDimension(general, 'gender')
assert.equal(genderSeries.length, 2, 'General must declare exactly the gender members it observed')
assert.deepEqual(genderSeries.map((s) => s.key).sort(), ['FEMALE', 'MALE'])
for (const s of genderSeries) {
  assert.ok(s.data.some((v) => v > 0), `series ${s.key} must carry non-zero data from the live fixture`)
}

// ---- mutation: flip the 'Laki-laki' alias and confirm the check would catch it ----
{
  const mutatedWire = JSON.parse(JSON.stringify(wire)) as StrategicInsightGriQuantitativeWireResponse
  const item = mutatedWire[0]!.items.find((i) => i.description === 'Laki-laki')!
  item.description = 'Typo-laki'
  const { categories: mutated, warnings: mutatedWarnings } = normalizeGriQuantitative(mutatedWire)
  const mutatedItem = mutated[0]!.items.find((i) => i.id === item.id)!
  assert.deepEqual(mutatedItem.labels, {}, 'a broken alias must not still match')
  assert.ok(mutatedWarnings.some((w) => w.includes('Typo-laki')), 'a broken alias must warn')
}

// ---- mutation: two-token composite description (Energy 'Non-Renewable — Solar') splits both axes ----
{
  // The live 2-category fixture doesn't carry a composite description, so exercise the splitter
  // directly against a synthetic wire item shaped like the Energy tab's fuel breakdown.
  const synthetic: StrategicInsightGriQuantitativeWireResponse = [
    {
      category: 'ENERGY',
      summary: [],
      items: [
        {
          id: 'synthetic-1',
          period: 2025,
          entity: { id: 'e1', code: 'WS', name: 'Waskita Sintesa' },
          gri_code: '302-1a',
          metric_name: 'Energy Consumption',
          description: 'Non-Renewable — Solar',
          value: 100,
          unit_id: null,
          input_type: 'NUMBER',
        },
      ],
    },
  ]
  const { categories: syntheticCats } = normalizeGriQuantitative(synthetic)
  assert.deepEqual(syntheticCats[0]!.items[0]!.labels, {
    renewability: 'NON_RENEWABLE',
    fuel_type: 'DIESEL',
  })
}

console.log('ok — normalize: Phase 1+2 renames/derivations verified against the live fixture')
