declare global {
  type ExportCategory = 'GRI Disclosure' | 'SDG' | 'Realization'

  interface ExportFilter {
    period?: string
    entity?: string
    category?: ExportCategory
  }

  // AC-78: only Approved data is exportable — payload always carries status: 'Approved'
  interface ExportPayload {
    status: 'Approved'
    period?: string
    entity?: string
    category?: ExportCategory
  }

  interface ExportResult {
    url: string
  }

  interface ExportHistoryItem {
    id: string
    category: ExportCategory
    period: string
    entity: string
    created_at: string
    file_url: string
  }
}

export {}
