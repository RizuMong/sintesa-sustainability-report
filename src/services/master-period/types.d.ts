declare global {
  interface MasterPeriod {
    id: string
    year: number
    status: 'Active' | 'Inactive'
    // AC-04 — independent of `status`, gates Report Plan Realization submission
    realization_window: 'Open' | 'Closed'
  }
}

export {}
