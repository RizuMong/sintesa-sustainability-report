export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export const evaluationStatusBadgeType: Record<EvaluationStatus, 'announcement' | 'information' | 'completed' | 'critical'> = {
  draft: 'announcement',
  submitted: 'information',
  approved: 'completed',
  rejected: 'critical',
}

export const evaluationStatusOptions = (Object.keys(evaluationStatusBadgeType) as EvaluationStatus[]).map((value) => ({
  value,
  label: value,
}))

export interface EvaluationGriQuantitative {
  id: string
  indicator: string
  period: string
  value: string
  requestor: string
  note: string
  status: EvaluationStatus
  actor: string
  updatedAt: string
}

export type MkiInputType = 'NUMBER' | 'TEXT' | 'PERCENTAGE' | 'DATE' | 'YES_NO'
export type MkiStatus = 'Active' | 'Inactive'

export interface MasterCategory {
  id: string
  name: string
}

export interface MkiColumn {
  key: string
  name: string
  sequence: number
}

export interface MkiMetric {
  key: string
  name: string
  input_type: MkiInputType
  unit: { id: string; name: string } | null
  sequence: number
}

export interface MkiRow {
  sequence: number
  labels: Record<string, string>
}

// GET index (list mode) row shape
export interface MkiGriQuantitativeSummary {
  id: string
  name: string
  category: { id: string; name: string }
  code: string
  status: MkiStatus
  updated_at: string
}

// GET index (detail mode, ?id=) response, and create/update response
export interface MkiGriQuantitativeDetail {
  id: string
  name: string
  category: { id: string; name: string }
  code: string
  status: MkiStatus
  columns: MkiColumn[]
  metrics: MkiMetric[]
  rows: MkiRow[]
  updated_at: string
}

// POST create/update request body
export interface MkiGriQuantitativePayload {
  id?: string
  category: { id: string }
  code: string
  name: string
  columns: MkiColumn[]
  metrics: { key: string; name: string; input_type: MkiInputType; unit: { id: string } | null; sequence: number }[]
  rows: MkiRow[]
}
