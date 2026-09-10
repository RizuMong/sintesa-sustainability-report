// Pure, dependency-free (no vue, no '@/' alias) so the co-located check can run under a plain
// node runner. Tab-index bookkeeping for the dashboard pages.

// Where the tab strip should point after the category list changes.
//
// The naive version of this was `if (index >= list.length) index = list.length - 1`, which is
// wrong twice over: when the list shrinks it dumps the user on the LAST tab (an unrelated
// category) rather than keeping the one they were reading, and when the backend reorders
// `sequence` the same index silently becomes a different tab.
//
// So resolve by identity first and fall back to a clamp only when the previously selected
// category is genuinely gone. `previousId` is null on first render, which lands on tab 0.
export function nextTabIndex(
  categoryIds: string[],
  previousId: string | null,
  previousIndex: number,
): number {
  if (categoryIds.length === 0) return 0

  if (previousId !== null) {
    const moved = categoryIds.indexOf(previousId)
    // still present, possibly at a new position after a reorder — follow it
    if (moved !== -1) return moved
  }

  // the selected category no longer exists: stay as close to where the user was as possible
  // rather than jumping to either end
  return Math.min(Math.max(previousIndex, 0), categoryIds.length - 1)
}
