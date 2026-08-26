declare global {
  type TrackingStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'

  interface TrackingRow {
    entity: Ref2
    period: Ref2
    submission_type: string
    completion_percent: number
    status: TrackingStatus
    is_overdue: boolean
    unverified: boolean
  }
}

export {}
