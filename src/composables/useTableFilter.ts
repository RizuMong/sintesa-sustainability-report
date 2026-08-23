import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface ActiveFilter {
  column: string
  value: string
}

function getFieldValue(row: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], row)
}

// shared column+value substring filter for the Filter popover used on list/table pages
export function useTableFilter<T>(items: Ref<T[]> | ComputedRef<T[]>) {
  const activeFilter = ref<ActiveFilter | null>(null)

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
    activeFilter.value = null
  }

  return { filteredItems, applyFilter, resetFilter }
}
