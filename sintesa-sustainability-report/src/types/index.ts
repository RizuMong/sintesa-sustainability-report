export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

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

export interface MasterKeyIndicatorQuantitative {
  id: string
  name: string
  code: string
  unit: string
  category: string
}
