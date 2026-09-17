// node --experimental-strip-types src/composables/useTableFilter.check.ts
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useTableFilter } from './useTableFilter.ts'

const rows = ref([
  { id: '1', flow_status: 'draft', entity_id: { name: 'Alpha' } },
  { id: '2', flow_status: 'draft', entity_id: { name: 'Beta' } },
  { id: '3', flow_status: 'sent', entity_id: { name: 'Alpha' } },
  { id: '4', flow_status: 'rejected', entity_id: { name: 'Alpha' } },
  { id: '5', flow_status: 'rejected', entity_id: { name: 'Beta' } },
])

// no initial scope: starts on every row, reset goes back to every row
const all = useTableFilter(rows)
assert.equal(all.filteredItems.value.length, 5)
all.applyFilter({ column: 'flow_status', value: 'sent' })
assert.deepEqual(all.filteredItems.value.map((r) => r.id), ['3'])
all.resetFilter()
assert.equal(all.filteredItems.value.length, 5)

// initial scope: never unfiltered — opens scoped, and a box click switches scope
const scoped = useTableFilter(rows, { column: 'flow_status', value: 'draft' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['1', '2'])
scoped.applyScope({ column: 'flow_status', value: 'sent' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['3'])

// the reported bug: filtering while on a status tab must stay inside that status
scoped.applyScope({ column: 'flow_status', value: 'rejected' })
scoped.applyFilter({ column: 'entity_id.name', value: 'Alpha' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['4'], 'filter must not escape the Rejected tab')

// popover Reset clears the popover only and stays on the current status tab
scoped.resetFilter()
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['4', '5'])

// switching tabs drops a stale popover filter rather than silently carrying it over
scoped.applyFilter({ column: 'entity_id.name', value: 'Beta' })
scoped.applyScope({ column: 'flow_status', value: 'draft' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['1', '2'])

// a predicate scope (Approved by Me) is narrowable by the popover too
const byPredicate = useTableFilter(rows, { column: 'flow_status', value: 'draft' }, {
  __mine: (r) => r.entity_id.name === 'Alpha',
})
byPredicate.applyScope({ column: '__mine', value: '' })
assert.deepEqual(byPredicate.filteredItems.value.map((r) => r.id), ['1', '3', '4'])
byPredicate.applyFilter({ column: 'flow_status', value: 'rejected' })
assert.deepEqual(byPredicate.filteredItems.value.map((r) => r.id), ['4'])

// scopedItems exposes the tab's rows before the popover narrows them
assert.deepEqual(byPredicate.scopedItems.value.map((r) => r.id), ['1', '3', '4'])

console.log('useTableFilter.check.ts ok')
