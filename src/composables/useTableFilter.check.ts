// node --experimental-strip-types src/composables/useTableFilter.check.ts
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useTableFilter } from './useTableFilter.ts'

const rows = ref([
  { id: '1', flow_status: 'draft' },
  { id: '2', flow_status: 'draft' },
  { id: '3', flow_status: 'sent' },
])

// no initial filter: starts on every row, reset goes back to every row
const all = useTableFilter(rows)
assert.equal(all.filteredItems.value.length, 3)
all.applyFilter({ column: 'flow_status', value: 'sent' })
assert.deepEqual(all.filteredItems.value.map((r) => r.id), ['3'])
all.resetFilter()
assert.equal(all.filteredItems.value.length, 3)

// initial filter: never unfiltered — opens scoped, and reset returns to that scope, not to all
const scoped = useTableFilter(rows, { column: 'flow_status', value: 'draft' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['1', '2'])
scoped.applyFilter({ column: 'flow_status', value: 'sent' })
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['3'])
scoped.resetFilter()
assert.deepEqual(scoped.filteredItems.value.map((r) => r.id), ['1', '2'])

console.log('useTableFilter.check.ts ok')
