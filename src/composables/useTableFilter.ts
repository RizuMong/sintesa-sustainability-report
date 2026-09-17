import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface ActiveFilter {
  column: string
  value: string
}

function getFieldValue(row: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], row)
}

// shared column+value substring filter for the Filter popover used on list/table pages.
//
// Two independent layers, deliberately:
//   1. `scopeFilter` — the status tab the page is on (the summary boxes). Set with applyScope().
//      Pages that pass `initialScope` are never unscoped; the popover cannot leave that scope.
//   2. `activeFilter` — the Filter popover's column+value substring match, which NARROWS the
//      current scope instead of replacing it. This is the bug fix: filtering while on Rejected
//      used to search every status because both layers shared one state.
// `predicates` lets either layer express a filter that isn't a field/substring match — the approval
// screen's "Approved by Me" box is a predicate over approval_logs, not a flow_status value.
// A filter whose column names a predicate uses it and ignores `value`.
export function useTableFilter<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  initialScope: ActiveFilter | null = null,
  predicates: Record<string, (row: T) => boolean> = {},
) {
  const scopeFilter = ref<ActiveFilter | null>(initialScope)
  const activeFilter = ref<ActiveFilter | null>(null)

  function matches(row: T, filter: ActiveFilter | null): boolean {
    if (!filter) return true
    const predicate = predicates[filter.column]
    if (predicate) return predicate(row)
    const needle = filter.value.toLowerCase()
    return String(getFieldValue(row, filter.column) ?? '').toLowerCase().includes(needle)
  }

  // Rows visible for the current status tab, before the popover narrows them. Pages can show a
  // "no results for this filter" state by comparing this with filteredItems.
  const scopedItems = computed(() =>
    scopeFilter.value ? items.value.filter((row) => matches(row, scopeFilter.value)) : items.value,
  )

  const filteredItems = computed(() =>
    activeFilter.value ? scopedItems.value.filter((row) => matches(row, activeFilter.value)) : scopedItems.value,
  )

  // The popover: narrows within the current scope.
  function applyFilter(filter: ActiveFilter) {
    activeFilter.value = filter
  }

  // A summary box / status tab: switches scope and drops the popover filter, so the new tab opens
  // showing everything in it rather than silently carrying a filter from the previous tab.
  function applyScope(filter: ActiveFilter | null) {
    scopeFilter.value = filter
    activeFilter.value = null
  }

  // Popover "Reset" clears the popover only and stays on the current status tab.
  function resetFilter() {
    activeFilter.value = null
  }

  return { filteredItems, scopedItems, activeFilter, scopeFilter, applyFilter, applyScope, resetFilter }
}
