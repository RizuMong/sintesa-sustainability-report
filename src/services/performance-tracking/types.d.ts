declare global {
  type TrackingStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'

  interface TrackingRow {
    // ponytail: swap to Ref2 once Stream C lands
    entity: { id: string; name: string }
    period: { id: string; name: string }
    submission_type: string
    completion_percent: number
    status: TrackingStatus
    is_overdue: boolean
    unverified: boolean
  }
}

export {}
