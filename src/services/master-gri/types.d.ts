declare global {
  type GriSeries = 'Universal' | 'Economic' | 'Environmental' | 'Social'

  interface MasterGri {
    id: string
    gri_code: string
    gri_series: GriSeries
    disclosure_title: string
    status: 'Active' | 'Inactive'
  }
}

export {}
