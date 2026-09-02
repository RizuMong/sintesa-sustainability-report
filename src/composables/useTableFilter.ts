import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface ActiveFilter {
  column: string
  value: string
}

function getFieldValue(row: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], row)
}

// shared column+value substring filter for the Filter popover used on list/table pages.
// `initialFilter` is the filter the table starts on and the one resetFilter() returns to — pages
// whose summary blocks act as status tabs (evaluate-gri-quantitative) pass a flow_status filter so
// the list is never shown unfiltered; pages that pass nothing behave as before (start/reset = all).
export function useTableFilter<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  initialFilter: ActiveFilter | null = null,
) {
  const activeFilter = ref<ActiveFilter | null>(initialFilter)

  const filteredItems = computed(() => {
    if (!activeFilter.value) return items.value
    const { column, value } = activeFilter.value
    const needle = value.toLowerCase()
    return items.value.filter((row) => String(getFieldValue(row, column) ?? '').toLowerCase().includes(needle))
  })

  function applyFilter(filter: ActiveFilter) {
    activeFilter.value = filter
  }

  function resetFilter() {
    activeFilter.value = initialFilter
  }

  return { filteredItems, activeFilter, applyFilter, resetFilter }
}
