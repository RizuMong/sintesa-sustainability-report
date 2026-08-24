// Pure business-rule helper, kept import-alias-free so api.check.ts can run under plain node.

// AC-38 + retrigger rule: a manual re-trigger always logs as Manual/Success — the shape the UI expects
// to see appended after a successful retrigger, whether the backend returns it or the list is refetched.
export function buildRetriggeredLogRow(original: Pick<GenerateActionPlanLog, 'submission_type' | 'recipient_count'>) {
  return {
    timestamp: new Date().toISOString(),
    trigger_type: 'Manual' as const,
    submission_type: original.submission_type,
    recipient_count: original.recipient_count,
    status: 'Success' as const,
  }
}
