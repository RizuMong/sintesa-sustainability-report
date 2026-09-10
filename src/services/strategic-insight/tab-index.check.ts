// run: node --experimental-strip-types src/services/strategic-insight/tab-index.check.ts
//
// Covers the tab-index bookkeeping behind the GRI Quantitative dashboard's 8-tab strip.
// This exists because the interaction it guards is easy to get wrong and invisible in a
// typecheck: MpTabs (0.0.25) ignores `modelValue` on the way in unless `is-manual` is set, so
// a page that moves the index itself must both pass `is-manual` AND compute a sensible index.
import assert from 'node:assert/strict'
import { nextTabIndex } from './tab-index.ts'

const TABS = ['general', 'energy', 'waste', 'water', 'diversity', 'employment', 'ohs', 'training']

// first render — nothing selected yet
assert.equal(nextTabIndex(TABS, null, 0), 0, 'first render selects the first tab')

// steady state — the selection is preserved
assert.equal(nextTabIndex(TABS, 'waste', 2), 2, 'unchanged list keeps the selection')

// the backend reorders `sequence`: follow the category, not the slot
const REORDERED = ['energy', 'general', 'waste', 'water', 'diversity', 'employment', 'ohs', 'training']
assert.equal(
  nextTabIndex(REORDERED, 'general', 0),
  1,
  'a reorder follows the selected category to its new index',
)
assert.equal(
  nextTabIndex(REORDERED, 'training', 7),
  7,
  'a reorder leaves an unmoved category where it is',
)

// a filter shrinks the list but the selection survives — do NOT jump to the end
const SHRUNK = ['general', 'waste', 'training']
assert.equal(
  nextTabIndex(SHRUNK, 'training', 7),
  2,
  'a surviving selection is followed even when its index moved a long way',
)
assert.equal(nextTabIndex(SHRUNK, 'general', 0), 0, 'a surviving first tab stays first')

// the selected category is gone: stay near where the user was, and never out of range
assert.equal(
  nextTabIndex(SHRUNK, 'ohs', 6),
  2,
  'a vanished selection clamps into range instead of overflowing',
)
assert.equal(
  nextTabIndex(SHRUNK, 'ohs', 1),
  1,
  'a vanished selection keeps the nearby index rather than jumping to an end',
)

// empty payload (loading, or a filter matching nothing)
assert.equal(nextTabIndex([], 'general', 3), 0, 'an empty list resets to 0')
assert.equal(nextTabIndex([], null, 0), 0, 'an empty list with no selection is 0')

// the invariant that actually matters: the result always indexes a real tab, or is 0 when empty
for (const list of [TABS, REORDERED, SHRUNK, []]) {
  for (const id of [...TABS, 'nonexistent', null]) {
    for (const idx of [-1, 0, 3, 7, 99]) {
      const next = nextTabIndex(list, id as string | null, idx)
      if (list.length === 0) {
        assert.equal(next, 0, 'empty list must yield 0')
      } else {
        assert.ok(
          next >= 0 && next < list.length,
          `index ${next} out of range for a ${list.length}-tab list`,
        )
      }
    }
  }
}

console.log('ok — tab index: reorder, shrink, vanish, empty, and in-range invariant')
